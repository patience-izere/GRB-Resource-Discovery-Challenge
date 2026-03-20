"""
Census API views — query rwanda_census.db directly via sqlite3.
All responses are cached for 24 hours (data is static between ETL runs).
"""
import sqlite3
import csv
import io
from pathlib import Path

from django.conf import settings
from django.core.cache import cache
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

CENSUS_DB = Path(settings.BASE_DIR) / 'data' / 'census' / 'rwanda_census.db'
CACHE_TTL = 86400  # 24 hours


def _query(sql, params=()):
    """Execute a read-only query and return list of dicts."""
    conn = sqlite3.connect(CENSUS_DB)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute(sql, params)
        return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def _db_exists():
    return CENSUS_DB.exists()


def _strip(rows, key='name'):
    """Strip whitespace/non-breaking spaces from a name field in-place."""
    for r in rows:
        if isinstance(r.get(key), str):
            r[key] = r[key].replace('\xa0', ' ').strip()
    return rows


# ── Overview ──────────────────────────────────────────────────────────────────

class CensusOverviewView(APIView):
    """
    GET /api/census/overview/
    Returns national population quick stats and historical trend.
    """

    def get(self, request):
        if not _db_exists():
            return Response({'error': 'Census database not found.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        cache_key = 'census_overview'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        # National row from t001
        pop_rows = _query(
            "SELECT counts_both_sexes, counts_male, counts_female, "
            "population_density_both_sexes AS density "
            "FROM t001 WHERE geo_type='country' LIMIT 1"
        )
        pop = pop_rows[0] if pop_rows else {}

        # Medical insurance national rate from t028
        insurance_rows = _query(
            "SELECT total_both_sexes AS insurance_coverage "
            "FROM t028 WHERE geo_type='country' LIMIT 1"
        )
        insurance = insurance_rows[0] if insurance_rows else {}

        # Primary school net attendance from t018 (national row)
        edu_rows = _query(
            "SELECT net_attendance_rates_2_nar AS primary_nar_both, "
            "net_attendance_rates_2_nar_1 AS primary_nar_male, "
            "net_attendance_rates_2_nar_2 AS primary_nar_female "
            "FROM t018 WHERE geo_name='Rwanda' LIMIT 1"
        )
        edu = edu_rows[0] if edu_rows else {}

        # Agricultural households from t079 (national)
        agric_rows = _query(
            "SELECT agricultural_households_percentage AS agric_hh_pct "
            "FROM t079 WHERE geo_type='country' LIMIT 1"
        )
        agric = agric_rows[0] if agric_rows else {}

        # Electricity access from t074 (national)
        elec_rows = _query(
            "SELECT area_of_residence_rwanda AS electricity_access "
            "FROM t074 WHERE geo_type='country' LIMIT 1"
        )
        elec = elec_rows[0] if elec_rows else {}

        # Fertility - general fertility rate from t033 (national)
        fert_rows = _query(
            "SELECT natality_indicators_general_fertility_rate_gfr_number_of_births_per_1000_wo AS gfr "
            "FROM t033 WHERE geo_type='country' LIMIT 1"
        )
        fert = fert_rows[0] if fert_rows else {}

        # Historical population from t004 (year rows)
        history = _query(
            "SELECT geo_name AS year, sex_both_sexes AS total, "
            "sex_male AS male, sex_female AS female "
            "FROM t004 WHERE geo_name GLOB '[0-9][0-9][0-9][0-9]' "
            "ORDER BY geo_name"
        )

        # Drinking water access (national) from t068
        water_rows = _query(
            "SELECT col_1 AS water_access_pct FROM t068 WHERE geo_type='country' LIMIT 1"
        )
        water = water_rows[0] if water_rows else {}

        # Dependency ratio: compute from t005 age groups
        age_data = _query("SELECT geo_name, col_1 FROM t005 WHERE geo_type IS NULL")
        dep_ratio = _compute_dependency_ratio(age_data)

        # Disability prevalence (national — t054 has no country row, sum provinces)
        disability_rows = _query(
            "SELECT SUM(counts_both_sexes_391775_34730) AS total_disabled, "
            "AVG(CAST(percentage_both_sexes_3_4_2_3 AS REAL)) AS avg_pct "
            "FROM t054 WHERE geo_type='province'"
        )
        disability = disability_rows[0] if disability_rows else {}

        result = {
            'total_population': pop.get('counts_both_sexes'),
            'male_population': pop.get('counts_male'),
            'female_population': pop.get('counts_female'),
            'population_density': pop.get('density'),
            'insurance_coverage_pct': insurance.get('insurance_coverage'),
            'primary_net_attendance_pct': edu.get('primary_nar_both'),
            'agricultural_households_pct': agric.get('agric_hh_pct'),
            'electricity_access_pct': elec.get('electricity_access'),
            'water_access_pct': water.get('water_access_pct'),
            'general_fertility_rate': fert.get('gfr'),
            'dependency_ratio': dep_ratio,
            'census_year': 2022,
            'history': history,
        }
        cache.set(cache_key, result, CACHE_TTL)
        return Response(result)


def _compute_dependency_ratio(age_data):
    """Compute dependency ratio from t005 age group rows."""
    age_map = {}
    for row in age_data:
        name = (row['geo_name'] or '').replace('\xa0', ' ').strip()
        try:
            val = int(str(row['col_1']).replace(',', '').strip())
            age_map[name] = val
        except (ValueError, TypeError):
            pass

    youth_groups = ['0-4', '5-9', '10-14']
    elder_groups = ['65-69', '70-74', '75-79', '80-84', '85+']
    working_groups = ['15-19', '20-24', '25-29', '30-34', '35-39',
                      '40-44', '45-49', '50-54', '55-59', '60-64']

    youth = sum(age_map.get(g, 0) for g in youth_groups)
    elderly = sum(age_map.get(g, 0) for g in elder_groups)
    working = sum(age_map.get(g, 0) for g in working_groups)

    if working == 0:
        return None
    return round((youth + elderly) / working * 100, 1)


# ── Regional breakdown ────────────────────────────────────────────────────────

class CensusRegionalView(APIView):
    """
    GET /api/census/regional/
    Returns province and district population breakdown.
    Query params: ?level=province|district (default: province)
    """

    def get(self, request):
        if not _db_exists():
            return Response({'error': 'Census database not found.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        level = request.query_params.get('level', 'province')
        if level not in ('province', 'district'):
            level = 'province'

        cache_key = f'census_regional_{level}'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        rows = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "counts_both_sexes AS total, counts_male AS male, counts_female AS female, "
            "population_density_both_sexes AS density, "
            "population_share_of_the_total_population_both_sexes AS share_pct "
            "FROM t001 WHERE geo_type=? ORDER BY counts_both_sexes DESC",
            (level,)
        )
        _strip(rows)

        result = {'level': level, 'regions': rows}
        cache.set(cache_key, result, CACHE_TTL)
        return Response(result)


# ── Sectors ───────────────────────────────────────────────────────────────────

class CensusSectorView(APIView):
    """
    GET /api/census/sectors/<sector>/
    Sectors: population, education, health, agriculture, households
    Query params: ?level=province|district (default: province)
    """

    def get(self, request, sector):
        if not _db_exists():
            return Response({'error': 'Census database not found.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        level = request.query_params.get('level', 'province')
        if level not in ('province', 'district'):
            level = 'province'

        handlers = {
            'population':  self._population,
            'education':   self._education,
            'health':      self._health,
            'agriculture': self._agriculture,
            'households':  self._households,
        }
        handler = handlers.get(sector)
        if not handler:
            return Response(
                {'error': f'Unknown sector "{sector}". Valid: {list(handlers.keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cache_key = f'census_sector_{sector}_{level}'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        result = handler(level)
        result['sector'] = sector
        result['level'] = level
        cache.set(cache_key, result, CACHE_TTL)
        return Response(result)

    # ── Population ──────────────────────────────────────────────────────────

    def _population(self, level):
        # Province-level population for chart
        provinces = _query(
            "SELECT geo_name AS name, counts_both_sexes AS total, "
            "counts_male AS male, counts_female AS female "
            "FROM t001 WHERE geo_type='province' ORDER BY counts_both_sexes DESC"
        )
        _strip(provinces)

        # Disability counts by province/district (t054)
        disability = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "counts_both_sexes_391775_34730 AS disability_count, "
            "counts_male_174949_15502 AS disability_male, "
            "counts_female_216826_19228 AS disability_female, "
            "percentage_both_sexes_3_4_2_3 AS disability_pct, "
            "percentage_male_3_1_2 AS disability_pct_male, "
            "percentage_female_3_6_2_6 AS disability_pct_female "
            "FROM t054 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(disability)

        # Disability types (national) from t055 — rows are types, not geo areas
        disability_types = _query(
            "SELECT geo_name AS type, "
            "total_both_sexes AS pct_both, total_male AS pct_male, total_female AS pct_female "
            "FROM t055 WHERE geo_name NOT IN ('concentrating','')"
        )
        # Clean split-row artifact for "Remembering and concentrating"
        for r in disability_types:
            if r['type'] and 'Remembering' in str(r['type']):
                r['type'] = 'Remembering/Concentrating'

        # Age group distribution (national) from t005
        age_raw = _query("SELECT geo_name, col_1 FROM t005 WHERE geo_type IS NULL")
        age_groups = []
        standard_groups = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29',
                           '30-34', '35-39', '40-44', '45-49', '50-54',
                           '55-59', '60-64', '65-69', '70-74', '75-79', '80-84', '85+']
        age_map = {}
        for row in age_raw:
            name = (row['geo_name'] or '').replace('\xa0', ' ').strip()
            try:
                val = int(str(row['col_1']).replace(',', '').strip())
                age_map[name] = val
            except (ValueError, TypeError):
                pass
        for g in standard_groups:
            if g in age_map:
                age_groups.append({'age_group': g, 'count': age_map[g]})

        dep_ratio = _compute_dependency_ratio(age_raw)

        # Migration: t032 (district level net migration)
        migration = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "lifetime_migration_in_migrants AS lifetime_in, "
            "lifetime_migration_out_migrants AS lifetime_out, "
            "lifetime_migration_in_migrants_out_migrants_net_migration AS lifetime_net, "
            "recent_migration_in_migrants AS recent_in, "
            "recent_migration_out_migrants AS recent_out, "
            "recent_migration_in_migrants_out_migrants_net_migration AS recent_net "
            "FROM t032 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(migration)
        # Filter out rows where all migration values are NULL
        migration = [r for r in migration if any(
            r.get(k) is not None for k in ('lifetime_in', 'lifetime_out', 'recent_in', 'recent_out')
        )]

        return {
            'provinces': provinces,
            'age_groups': age_groups,
            'dependency_ratio': dep_ratio,
            'disability': disability,
            'disability_types': disability_types,
            'migration': migration,
        }

    # ── Education ────────────────────────────────────────────────────────────

    def _education(self, level):
        # Primary attendance by province/district (t018)
        primary = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "net_attendance_rates_2_nar AS nar_both, "
            "net_attendance_rates_2_nar_1 AS nar_male, "
            "net_attendance_rates_2_nar_2 AS nar_female, "
            "gross_attendance_rates_1_gar AS gar_both "
            "FROM t018 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(primary)

        # Secondary attendance (t019) — note: column prefix differs from t018
        secondary = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "net_attendance_rates_nar AS nar_both, "
            "net_attendance_rates_nar_1 AS nar_male, "
            "net_attendance_rates_nar_2 AS nar_female, "
            "gross_attendance_rates_gar AS gar_both "
            "FROM t019 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(secondary)

        # National summary
        national = _query(
            "SELECT net_attendance_rates_2_nar AS primary_nar, "
            "net_attendance_rates_2_nar_1 AS primary_nar_male, "
            "net_attendance_rates_2_nar_2 AS primary_nar_female "
            "FROM t018 WHERE geo_name='Rwanda' LIMIT 1"
        )

        # Out-of-school children (t012) — province/district level
        out_of_school = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "count_3824658 AS school_age_pop, "
            "currently_attending_81_3 AS attending_pct, "
            "no_longer_attending_12_5 AS dropout_pct, "
            "never_attended_6_2 AS never_attended_pct "
            "FROM t012 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(out_of_school)
        # Compute out-of-school count for each row
        for r in out_of_school:
            try:
                pop = float(r['school_age_pop'] or 0)
                attending = float(r['attending_pct'] or 0)
                r['out_of_school_count'] = round(pop * (1 - attending / 100))
                r['out_of_school_pct'] = round(100 - attending, 1)
            except (TypeError, ValueError):
                r['out_of_school_count'] = None
                r['out_of_school_pct'] = None

        # National out-of-school
        oos_nat = _query(
            "SELECT count_3824658 AS school_age_pop, "
            "currently_attending_81_3 AS attending_pct, "
            "no_longer_attending_12_5 AS dropout_pct, "
            "never_attended_6_2 AS never_attended_pct "
            "FROM t012 WHERE geo_type='country' LIMIT 1"
        )
        nat_oos = oos_nat[0] if oos_nat else {}
        if nat_oos:
            try:
                pop = float(nat_oos.get('school_age_pop') or 0)
                attending = float(nat_oos.get('attending_pct') or 0)
                nat_oos['out_of_school_count'] = round(pop * (1 - attending / 100))
                nat_oos['out_of_school_pct'] = round(100 - attending, 1)
            except (TypeError, ValueError):
                pass

        # Secondary national summary
        sec_national = _query(
            "SELECT net_attendance_rates_nar AS secondary_nar, "
            "net_attendance_rates_nar_1 AS secondary_nar_male, "
            "net_attendance_rates_nar_2 AS secondary_nar_female "
            "FROM t019 WHERE geo_name='Rwanda' LIMIT 1"
        )

        return {
            'national': {**(national[0] if national else {}), **(sec_national[0] if sec_national else {}), **nat_oos},
            'primary_attendance': primary,
            'secondary_attendance': secondary,
            'out_of_school': out_of_school,
        }

    # ── Health ───────────────────────────────────────────────────────────────

    def _health(self, level):
        # Medical insurance (t028)
        insurance = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "total_both_sexes AS coverage_both, total_male AS coverage_male, "
            "total_female AS coverage_female, urban_both_sexes AS coverage_urban, "
            "rural_both_sexes AS coverage_rural "
            "FROM t028 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(insurance)

        # General fertility rate by province/district (t033)
        fertility = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "natality_indicators_general_fertility_rate_gfr_number_of_births_per_1000_wo AS gfr, "
            "natality_indicators_standardized_birth_rate_sbr_number_of_births_per_1000_p AS sbr "
            "FROM t033 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(fertility)

        # Total Fertility Rate by province (t034)
        tfr = _query(
            "SELECT geo_name AS name, "
            "total_fertility_rate_tfr_children_per_woman_3_6 AS tfr, "
            "number_of_women_aged_15_49_years_3445665 AS women_15_49 "
            "FROM t034 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(tfr)

        # National insurance summary
        national = _query(
            "SELECT total_both_sexes AS coverage_both, total_male AS coverage_male, "
            "total_female AS coverage_female "
            "FROM t028 WHERE geo_type='country' LIMIT 1"
        )

        # National TFR
        nat_tfr = _query(
            "SELECT total_fertility_rate_tfr_children_per_woman_3_6 AS tfr "
            "FROM t034 WHERE geo_type='country' LIMIT 1"
        )

        # Disability & health: insurance among disabled (t056) — national
        dis_insurance = _query(
            "SELECT has_disability_both_sexes AS with_disability_pct "
            "FROM t056 WHERE geo_type='country' LIMIT 1"
        )

        return {
            'national': {
                **(national[0] if national else {}),
                **(nat_tfr[0] if nat_tfr else {}),
            },
            'insurance': insurance,
            'fertility': fertility,
            'tfr': tfr,
            'disability_insurance': dis_insurance[0] if dis_insurance else {},
        }

    # ── Agriculture ──────────────────────────────────────────────────────────

    def _agriculture(self, level):
        # Agricultural households (t079)
        agric_hh = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "total_households_counts AS total_hh, "
            "agricultural_households_counts AS agric_hh_count, "
            "agricultural_households_percentage AS agric_hh_pct "
            "FROM t079 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(agric_hh)

        # Agricultural HH by gender of HH head (t080)
        gender_hh = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "total_households_counts AS total_hh, "
            "total_households_counts_1 AS male_hh, "
            "total_households_counts_2 AS female_hh, "
            "agricultural_households_counts_3 AS agric_pct_all, "
            "agricultural_households_counts_4 AS agric_pct_male_head, "
            "agricultural_households_counts_5 AS agric_pct_female_head "
            "FROM t080 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(gender_hh)

        # Crop types by province/district (t082)
        crops = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "maize_56_3 AS maize, rice_2_3 AS rice, sorghum_18_8 AS sorghum, "
            "bean_79_9 AS bean, soybean_10_8 AS soybean, cassava_48_7 AS cassava, "
            "sweet_potato_44_3 AS sweet_potato, irish_potato_14_4 AS irish_potato, "
            "banana_24_4 AS banana, vegetables_15 AS vegetables "
            "FROM t082 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(crops)

        # National crop averages (embedded in column names, plus country row if it exists)
        nat_crops = _query(
            "SELECT maize_56_3 AS maize, rice_2_3 AS rice, sorghum_18_8 AS sorghum, "
            "bean_79_9 AS bean, soybean_10_8 AS soybean, cassava_48_7 AS cassava, "
            "sweet_potato_44_3 AS sweet_potato, irish_potato_14_4 AS irish_potato, "
            "banana_24_4 AS banana, vegetables_15 AS vegetables "
            "FROM t082 WHERE geo_type='country' LIMIT 1"
        )
        if not nat_crops:
            # Use national averages embedded in column names
            nat_crops = [{'maize': 56.3, 'rice': 2.3, 'sorghum': 18.8, 'bean': 79.9,
                          'soybean': 10.8, 'cassava': 48.7, 'sweet_potato': 44.3,
                          'irish_potato': 14.4, 'banana': 24.4, 'vegetables': 15}]

        # National summary
        national = _query(
            "SELECT agricultural_households_percentage AS agric_hh_pct, "
            "total_households_counts AS total_hh "
            "FROM t079 WHERE geo_type='country' LIMIT 1"
        )
        nat_gender = _query(
            "SELECT total_households_counts AS total_hh, "
            "total_households_counts_1 AS male_hh, "
            "total_households_counts_2 AS female_hh, "
            "agricultural_households_counts_3 AS agric_pct_all, "
            "agricultural_households_counts_4 AS agric_pct_male_head, "
            "agricultural_households_counts_5 AS agric_pct_female_head "
            "FROM t080 WHERE geo_type='country' LIMIT 1"
        )

        return {
            'national': {**(national[0] if national else {}), **(nat_gender[0] if nat_gender else {})},
            'by_region': agric_hh,
            'gender_hh': gender_hh,
            'crops': crops,
            'national_crops': nat_crops[0] if nat_crops else {},
        }

    # ── Households ───────────────────────────────────────────────────────────

    def _households(self, level):
        # Private households count (t058) — columns: total, urban, rural
        hh_count = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "total AS total_hh "
            "FROM t058 WHERE geo_type=? ORDER BY total DESC",
            (level,)
        )
        _strip(hh_count)

        # Electricity access (t074)
        electricity = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "area_of_residence_rwanda AS electricity_pct, "
            "area_of_residence_urban AS electricity_urban, "
            "area_of_residence_rural AS electricity_rural "
            "FROM t074 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(electricity)

        # Drinking water improved access (t068) — col_1=both%, col_2=urban, col_3=rural
        water = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "col_1 AS water_pct, col_2 AS water_urban, col_3 AS water_rural "
            "FROM t068 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(water)

        # Cooking energy (t076)
        cooking = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "firewood_76_1 AS firewood_pct, charcoal_17_3 AS charcoal_pct, "
            "gas_4_6 AS gas_pct, do_not_cook_1_4 AS no_cook_pct "
            "FROM t076 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(cooking)

        # Housing material — roof (t065)
        housing = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "iron_sheets_74_1 AS iron_sheets_pct, local_tiles_25_6 AS local_tiles_pct "
            "FROM t065 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(housing)

        # Mobile phone HH ownership (t025)
        mobile = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "area_of_residence_rwanda AS mobile_pct, "
            "area_of_residence_urban AS mobile_urban, "
            "area_of_residence_rural AS mobile_rural "
            "FROM t025 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(mobile)

        # Female-headed households (t059)
        female_hh = _query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "all_number AS total_hh, \"all\" AS female_hh_pct, "
            "urban AS female_hh_urban, rural AS female_hh_rural "
            "FROM t059 WHERE geo_type=? ORDER BY geo_name",
            (level,)
        )
        _strip(female_hh)

        # National summaries
        national_hh = _query(
            "SELECT total AS total_hh FROM t058 WHERE geo_type='country' LIMIT 1"
        )
        national_elec = _query(
            "SELECT area_of_residence_rwanda AS electricity_pct, "
            "area_of_residence_urban AS electricity_urban, "
            "area_of_residence_rural AS electricity_rural "
            "FROM t074 WHERE geo_type='country' LIMIT 1"
        )
        national_water = _query(
            "SELECT col_1 AS water_pct, col_2 AS water_urban, col_3 AS water_rural "
            "FROM t068 WHERE geo_type='country' LIMIT 1"
        )
        national_mobile = _query(
            "SELECT area_of_residence_rwanda AS mobile_pct, "
            "area_of_residence_urban AS mobile_urban, "
            "area_of_residence_rural AS mobile_rural "
            "FROM t025 WHERE geo_type='country' LIMIT 1"
        )
        national_female_hh = _query(
            "SELECT \"all\" AS female_hh_pct, urban AS female_hh_urban, rural AS female_hh_rural "
            "FROM t059 WHERE geo_type='country' LIMIT 1"
        )

        return {
            'national': {
                **(national_hh[0] if national_hh else {}),
                **(national_elec[0] if national_elec else {}),
                **(national_water[0] if national_water else {}),
                **(national_mobile[0] if national_mobile else {}),
                **(national_female_hh[0] if national_female_hh else {}),
                'firewood_pct': 76.1, 'charcoal_pct': 17.3, 'gas_pct': 4.6,
            },
            'household_counts': hh_count,
            'electricity': electricity,
            'water': water,
            'cooking': cooking,
            'housing': housing,
            'mobile': mobile,
            'female_hh': female_hh,
        }


# ── Projections ───────────────────────────────────────────────────────────────

class CensusProjectionsView(APIView):
    """
    GET /api/census/projections/
    Population projections 2022–2052 (t092).
    """

    def get(self, request):
        if not _db_exists():
            return Response({'error': 'Census database not found.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        cache_key = 'census_projections'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        rows = _query(
            "SELECT geo_name AS year, medium AS medium_total, "
            "medium_1 AS medium_urban, medium_2 AS medium_rural, "
            "high AS high_total, low AS low_total "
            "FROM t092 WHERE geo_name GLOB '[0-9][0-9][0-9][0-9]' "
            "ORDER BY geo_name"
        )

        result = {'projections': rows}
        cache.set(cache_key, result, CACHE_TTL)
        return Response(result)


# ── Deviations ────────────────────────────────────────────────────────────────

class CensusDeviationsView(APIView):
    """
    GET /api/census/deviations/
    Returns district-level indicators vs national averages.
    Useful to identify which districts are underperforming.
    """

    def get(self, request):
        if not _db_exists():
            return Response({'error': 'Census database not found.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        cache_key = 'census_deviations'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        # Collect national averages
        # t013: % of children aged 7–12 currently attending school (district-level indicator)
        nat_edu = _query(
            "SELECT CAST(total_both_sexes AS REAL) AS val FROM t013 WHERE geo_type='country' LIMIT 1"
        )
        nat_ins = _query(
            "SELECT CAST(total_both_sexes AS REAL) AS val FROM t028 WHERE geo_type='country' LIMIT 1"
        )
        nat_elec = _query(
            "SELECT CAST(area_of_residence_rwanda AS REAL) AS val FROM t074 WHERE geo_type='country' LIMIT 1"
        )
        nat_water = _query(
            "SELECT CAST(col_1 AS REAL) AS val FROM t068 WHERE geo_type='country' LIMIT 1"
        )
        nat_agric = _query(
            "SELECT CAST(agricultural_households_percentage AS REAL) AS val FROM t079 WHERE geo_type='country' LIMIT 1"
        )

        national_averages = {
            'primary_nar': _safe_float(nat_edu[0]['val'] if nat_edu else None),
            'insurance_pct': _safe_float(nat_ins[0]['val'] if nat_ins else None),
            'electricity_pct': _safe_float(nat_elec[0]['val'] if nat_elec else None),
            'water_pct': _safe_float(nat_water[0]['val'] if nat_water else None),
            'firewood_pct': 76.1,
            'agric_hh_pct': _safe_float(nat_agric[0]['val'] if nat_agric else None),
        }

        # District-level: primary school attendance (t013: % of 7–12 yr olds attending)
        # t018 only has province/country data; t013 has district breakdown
        edu_rows = {r['name']: r for r in _strip(_query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "CAST(total_both_sexes AS REAL) AS primary_nar, "
            "CAST(total_male AS REAL) AS primary_nar_male, "
            "CAST(total_female AS REAL) AS primary_nar_female "
            "FROM t013 WHERE geo_type='district' ORDER BY geo_name"
        ))}

        # Insurance
        ins_rows = {r['name']: r for r in _strip(_query(
            "SELECT geo_name AS name, "
            "CAST(total_both_sexes AS REAL) AS insurance_pct "
            "FROM t028 WHERE geo_type='district' ORDER BY geo_name"
        ))}

        # Electricity
        elec_rows = {r['name']: r for r in _strip(_query(
            "SELECT geo_name AS name, "
            "CAST(area_of_residence_rwanda AS REAL) AS electricity_pct "
            "FROM t074 WHERE geo_type='district' ORDER BY geo_name"
        ))}

        # Water
        water_rows = {r['name']: r for r in _strip(_query(
            "SELECT geo_name AS name, "
            "CAST(col_1 AS REAL) AS water_pct "
            "FROM t068 WHERE geo_type='district' ORDER BY geo_name"
        ))}

        # Cooking energy
        cooking_rows = {r['name']: r for r in _strip(_query(
            "SELECT geo_name AS name, "
            "CAST(firewood_76_1 AS REAL) AS firewood_pct "
            "FROM t076 WHERE geo_type='district' ORDER BY geo_name"
        ))}

        # Agric HH
        agric_rows = {r['name']: r for r in _strip(_query(
            "SELECT geo_name AS name, geo_parent AS province, "
            "CAST(agricultural_households_percentage AS REAL) AS agric_hh_pct "
            "FROM t079 WHERE geo_type='district' ORDER BY geo_name"
        ))}

        # Build merged district rows
        all_names = set(edu_rows) | set(ins_rows) | set(elec_rows) | set(water_rows)
        districts = []
        for name in sorted(all_names):
            province = (agric_rows.get(name) or edu_rows.get(name) or {}).get('province', '')
            row = {
                'name': name,
                'province': province,
                'primary_nar': edu_rows.get(name, {}).get('primary_nar'),
                'primary_nar_male': edu_rows.get(name, {}).get('primary_nar_male'),
                'primary_nar_female': edu_rows.get(name, {}).get('primary_nar_female'),
                'insurance_pct': ins_rows.get(name, {}).get('insurance_pct'),
                'electricity_pct': elec_rows.get(name, {}).get('electricity_pct'),
                'water_pct': water_rows.get(name, {}).get('water_pct'),
                'firewood_pct': cooking_rows.get(name, {}).get('firewood_pct'),
                'agric_hh_pct': agric_rows.get(name, {}).get('agric_hh_pct'),
            }
            districts.append(row)

        result = {
            'national_averages': national_averages,
            'districts': districts,
        }
        cache.set(cache_key, result, CACHE_TTL)
        return Response(result)


def _safe_float(val):
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


# ── Vulnerability Scorecard ───────────────────────────────────────────────────

class CensusVulnerabilityView(APIView):
    """
    GET /api/census/vulnerability/
    Composite vulnerability scorecard ranking districts by need.

    Scoring (0-100, higher = more vulnerable):
      - primary_nar:     100 - nar        (low attendance = vulnerable)
      - insurance_pct:   100 - coverage   (low insurance = vulnerable)
      - electricity_pct: 100 - elec       (low electricity = vulnerable)
      - water_pct:       100 - water      (low water access = vulnerable)
      - firewood_pct:    firewood %       (high biomass use = vulnerable)
      - agric_hh_pct:    agric %          (high agric dependency = vulnerable)
    Final score = mean of the six component scores.
    """

    def get(self, request):
        if not _db_exists():
            return Response({'error': 'Census database not found.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        cache_key = 'census_vulnerability'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        # Reuse deviations data
        dev_view = CensusDeviationsView()
        dev_response = dev_view.get(None)
        dev_data = dev_response.data

        districts = dev_data.get('districts', [])
        scored = []
        for d in districts:
            components = {}
            scores = []

            def add(key, invert=True):
                val = _safe_float(d.get(key))
                if val is not None:
                    comp = (100 - val) if invert else val
                    comp = max(0, min(100, comp))
                    components[key] = round(comp, 1)
                    scores.append(comp)

            add('primary_nar', invert=True)
            add('insurance_pct', invert=True)
            add('electricity_pct', invert=True)
            add('water_pct', invert=True)
            add('firewood_pct', invert=False)
            add('agric_hh_pct', invert=False)

            if scores:
                composite = round(sum(scores) / len(scores), 1)
                scored.append({
                    'name': d['name'],
                    'province': d.get('province', ''),
                    'composite_score': composite,
                    'components': components,
                    'indicators': {k: d.get(k) for k in
                                   ('primary_nar', 'insurance_pct', 'electricity_pct',
                                    'water_pct', 'firewood_pct', 'agric_hh_pct')},
                })

        # Sort by composite score descending (most vulnerable first)
        scored.sort(key=lambda x: x['composite_score'], reverse=True)

        # Assign rank
        for i, d in enumerate(scored):
            d['rank'] = i + 1

        result = {
            'districts': scored,
            'indicator_labels': {
                'primary_nar': 'Primary NAR',
                'insurance_pct': 'Health Insurance',
                'electricity_pct': 'Electricity Access',
                'water_pct': 'Safe Water',
                'firewood_pct': 'Firewood Use',
                'agric_hh_pct': 'Agric HH Dependency',
            },
        }
        cache.set(cache_key, result, CACHE_TTL)
        return Response(result)


# ── Table index (metadata) ────────────────────────────────────────────────────

class CensusTableIndexView(APIView):
    """
    GET /api/census/tables/
    List all census tables with descriptions.
    """

    def get(self, request):
        if not _db_exists():
            return Response({'error': 'Census database not found.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        cache_key = 'census_table_index'
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        rows = _query("SELECT table_num, description FROM table_index ORDER BY table_num")
        result = {'count': len(rows), 'tables': rows}
        cache.set(cache_key, result, CACHE_TTL)
        return Response(result)


# ── CSV Export ────────────────────────────────────────────────────────────────

class CensusExportView(APIView):
    """
    GET /api/census/export/csv/
    Stream a CSV of the requested sector data.
    Query params: ?sector=population|education|health|agriculture|households
                  ?level=province|district
    """

    SECTOR_QUERIES = {
        'population': (
            "SELECT geo_name, geo_type, geo_parent, counts_both_sexes, counts_male, "
            "counts_female, population_density_both_sexes "
            "FROM t001 WHERE geo_type IN ('province','district') ORDER BY geo_type, counts_both_sexes DESC",
            ['Region', 'Level', 'Province', 'Total Population', 'Male', 'Female', 'Density (per km²)']
        ),
        'education': (
            "SELECT geo_name, geo_type, geo_parent, "
            "net_attendance_rates_2_nar, net_attendance_rates_2_nar_1, net_attendance_rates_2_nar_2 "
            "FROM t018 WHERE geo_type IN ('province','district') ORDER BY geo_type, geo_name",
            ['Region', 'Level', 'Province', 'Primary NAR (Both)', 'Primary NAR (Male)', 'Primary NAR (Female)']
        ),
        'health': (
            "SELECT geo_name, geo_type, geo_parent, "
            "total_both_sexes, total_male, total_female, urban_both_sexes, rural_both_sexes "
            "FROM t028 WHERE geo_type IN ('province','district') ORDER BY geo_type, geo_name",
            ['Region', 'Level', 'Province', 'Insurance % (Both)', 'Insurance % (Male)', 'Insurance % (Female)', 'Insurance % (Urban)', 'Insurance % (Rural)']
        ),
        'agriculture': (
            "SELECT geo_name, geo_type, geo_parent, "
            "total_households_counts, agricultural_households_counts, agricultural_households_percentage "
            "FROM t079 WHERE geo_type IN ('province','district') ORDER BY geo_type, geo_name",
            ['Region', 'Level', 'Province', 'Total Households', 'Agricultural Households', 'Agricultural HH %']
        ),
        'households': (
            "SELECT t058.geo_name, t058.geo_type, t058.geo_parent, "
            "t058.total AS total_hh, "
            "t074.area_of_residence_rwanda AS electricity_pct, "
            "t068.col_1 AS water_pct, "
            "t076.firewood_76_1 AS firewood_pct "
            "FROM t058 "
            "LEFT JOIN t074 ON t058.geo_name=t074.geo_name "
            "LEFT JOIN t068 ON t058.geo_name=t068.geo_name "
            "LEFT JOIN t076 ON t058.geo_name=t076.geo_name "
            "WHERE t058.geo_type IN ('province','district') ORDER BY t058.geo_type, t058.geo_name",
            ['Region', 'Level', 'Province', 'Total Households', 'Electricity %', 'Safe Water %', 'Firewood %']
        ),
        'deviations': (
            "SELECT t018.geo_name, t018.geo_parent, "
            "t018.net_attendance_rates_2_nar AS primary_nar, "
            "t028.total_both_sexes AS insurance_pct, "
            "t074.area_of_residence_rwanda AS electricity_pct, "
            "t068.col_1 AS water_pct, "
            "t076.firewood_76_1 AS firewood_pct, "
            "t079.agricultural_households_percentage AS agric_hh_pct "
            "FROM t018 "
            "LEFT JOIN t028 ON t018.geo_name=t028.geo_name "
            "LEFT JOIN t074 ON t018.geo_name=t074.geo_name "
            "LEFT JOIN t068 ON t018.geo_name=t068.geo_name "
            "LEFT JOIN t076 ON t018.geo_name=t076.geo_name "
            "LEFT JOIN t079 ON t018.geo_name=t079.geo_name "
            "WHERE t018.geo_type='district' ORDER BY t018.geo_name",
            ['District', 'Province', 'Primary NAR %', 'Insurance %', 'Electricity %', 'Safe Water %', 'Firewood %', 'Agric HH %']
        ),
    }

    def get(self, request):
        if not _db_exists():
            return Response({'error': 'Census database not found.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        sector = request.query_params.get('sector', 'population')
        if sector not in self.SECTOR_QUERIES:
            sector = 'population'

        sql, headers = self.SECTOR_QUERIES[sector]
        rows = _query(sql)

        def stream():
            buf = io.StringIO()
            writer = csv.writer(buf)
            writer.writerow(headers)
            yield buf.getvalue()
            for row in rows:
                buf = io.StringIO()
                writer = csv.writer(buf)
                writer.writerow(list(row.values()))
                yield buf.getvalue()

        response = StreamingHttpResponse(stream(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="rwanda_census_2022_{sector}.csv"'
        return response
