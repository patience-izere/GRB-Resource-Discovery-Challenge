from api.models import Study, Metric, DetailedIndicator, Insight, GapAlert

SOURCES = {
    "studies": {
        "queryset": lambda: Study.objects.prefetch_related("resources"),
        "text_fn": lambda s: f"{s.title}. {s.abstract}. {' '.join(s.keywords)}. {s.methodology}. {s.organization}",
        "id_fn":   lambda s: s.pk,
    },
    "metrics": {
        "queryset": lambda: Metric.objects.all(),
        "text_fn": lambda m: f"{m.title} {m.domain} {m.trend}",
        "id_fn":   lambda m: m.id,
    },
    "indicators": {
        "queryset": lambda: DetailedIndicator.objects.all(),
        "text_fn": lambda i: f"{i.title} {i.domain} {i.source}",
        "id_fn":   lambda i: i.id,
    },
    "insights": {
        "queryset": lambda: Insight.objects.all(),
        "text_fn": lambda i: f"{i.headline}. {i.description}",
        "id_fn":   lambda i: i.id,
    },
    "gap_alerts": {
        "queryset": lambda: GapAlert.objects.all(),
        "text_fn": lambda g: f"{g.title}. {g.description}",
        "id_fn":   lambda g: g.id,
    },
}
