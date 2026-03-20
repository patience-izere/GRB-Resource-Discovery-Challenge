"""
Management command to build FAISS semantic search indices.

Usage:
  python manage.py build_search_index
  python manage.py build_search_index --source studies metrics
  python manage.py build_search_index --source census
"""
import os
import sqlite3
from django.core.management.base import BaseCommand
from search.indexer import build_index
from search.registry import SOURCES
from search.census_indexer import build_census_index

CENSUS_DB = os.path.join(
    os.path.dirname(__file__), '..', '..', '..', 'data', 'census', 'rwanda_census_2022.db'
)

ALL_SOURCES = list(SOURCES.keys()) + ["census"]


def _build_census_records() -> list[dict]:
    """
    Produce one searchable document per (geography × census table) pair.
    Text = "<geo_name> <geo_type> in <parent> | <table description>"
    """
    if not os.path.exists(CENSUS_DB):
        return []

    conn = sqlite3.connect(CENSUS_DB)
    conn.row_factory = sqlite3.Row
    try:
        geo_rows = conn.execute(
            "SELECT geo_id, name, geo_type, parent_name FROM geo"
        ).fetchall()

        table_rows = conn.execute(
            "SELECT table_num, description FROM table_index"
        ).fetchall()

        records = []
        for geo in geo_rows:
            geo_id = geo["geo_id"]
            geo_name = geo["name"]
            geo_type = geo["geo_type"]
            parent = geo["parent_name"] or ""
            location_text = f"{geo_name} ({geo_type})" + (f" in {parent}" if parent else "")

            for tbl in table_rows:
                table_num = tbl["table_num"]
                description = tbl["description"]
                record_id = f"census-geo{geo_id}-t{table_num:03d}"
                text = f"{location_text}: {description}"
                records.append({
                    "id": record_id,
                    "geo_id": geo_id,
                    "geo_name": geo_name,
                    "geo_type": geo_type,
                    "parent": parent,
                    "table_num": table_num,
                    "table_description": description,
                    "text": text,
                })
        return records
    finally:
        conn.close()


class Command(BaseCommand):
    help = "Build FAISS semantic search indices from the current database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source", nargs="*", default=ALL_SOURCES,
            help="Which indices to build (default: all). Choices: " + ", ".join(ALL_SOURCES),
        )

    def handle(self, *args, **options):
        from django.db import OperationalError as DjOperationalError
        from django.core.management import call_command

        # Ensure tables exist before querying any model
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM api_study LIMIT 1")
        except DjOperationalError:
            self.stderr.write(self.style.ERROR(
                "Database tables are missing. Run migrations first:\n"
                "  python manage.py migrate\n"
                "Then optionally seed data:\n"
                "  python manage.py seed_data\n"
                "  python manage.py load_csv_data\n"
                "Then re-run:  python manage.py build_search_index"
            ))
            return

        requested = options["source"]

        for name in requested:
            if name == "census":
                self.stdout.write(f"  [building] census ...")
                records = _build_census_records()
                if not records:
                    self.stdout.write(f"  [skip] census: DB not found or empty")
                    continue
                build_census_index(records)
                self.stdout.write(self.style.SUCCESS(
                    f"  [ok] census: {len(records)} vectors indexed"
                ))
                continue

            if name not in SOURCES:
                self.stderr.write(f"  [warn] unknown source '{name}', skipping")
                continue

            cfg = SOURCES[name]
            try:
                objects = list(cfg["queryset"]())
            except DjOperationalError as e:
                self.stderr.write(self.style.WARNING(f"  [skip] {name}: table missing ({e})"))
                continue

            if not objects:
                self.stdout.write(f"  [skip] {name}: no records")
                continue

            texts = [cfg["text_fn"](o) for o in objects]
            ids   = [cfg["id_fn"](o)   for o in objects]
            build_index(name, texts, ids)
            self.stdout.write(self.style.SUCCESS(
                f"  [ok] {name}: {len(ids)} vectors indexed"
            ))

        # Invalidate in-process cache so searcher picks up new indices
        from search.searcher import invalidate_cache
        invalidate_cache()
        self.stdout.write(self.style.SUCCESS("Done. In-process search cache cleared."))
