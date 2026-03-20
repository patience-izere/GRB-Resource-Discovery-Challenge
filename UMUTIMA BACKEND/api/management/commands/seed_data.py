"""
Management command to seed the database with sample gender data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from api.models import Metric, Insight, GapAlert, DetailedIndicator, ChartData, Study, StudyResource, QualityReport


class Command(BaseCommand):
    help = 'Seed the database with sample gender indicator data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting data seeding...'))
        
        # Clear existing data
        Metric.objects.all().delete()
        Insight.objects.all().delete()
        GapAlert.objects.all().delete()
        DetailedIndicator.objects.all().delete()
        ChartData.objects.all().delete()
        
        # Create Metrics
        metrics_data = [
            {
                'id': 'm1',
                'domain': 'economic',
                'title': 'Women Economic Participation',
                'value': '42.5%',
                'trend': '+3.2%',
                'trend_direction': 'up',
                'time_range': '2020-2024',
                'chart_data': [
                    {'x': 0, 'y': 38.2},
                    {'x': 1, 'y': 39.1},
                    {'x': 2, 'y': 40.5},
                    {'x': 3, 'y': 41.8},
                    {'x': 4, 'y': 42.5},
                ]
            },
            {
                'id': 'm2',
                'domain': 'health',
                'title': 'Maternal Mortality Ratio',
                'value': '258 per 100k',
                'trend': '-12.5%',
                'trend_direction': 'down',
                'time_range': '2020-2024',
                'chart_data': [
                    {'x': 0, 'y': 290},
                    {'x': 1, 'y': 280},
                    {'x': 2, 'y': 270},
                    {'x': 3, 'y': 264},
                    {'x': 4, 'y': 258},
                ]
            },
            {
                'id': 'm3',
                'domain': 'education',
                'title': 'Girls Secondary Enrollment',
                'value': '68.3%',
                'trend': '+5.1%',
                'trend_direction': 'up',
                'time_range': '2020-2024',
                'chart_data': [
                    {'x': 0, 'y': 60.2},
                    {'x': 1, 'y': 62.3},
                    {'x': 2, 'y': 64.5},
                    {'x': 3, 'y': 66.4},
                    {'x': 4, 'y': 68.3},
                ]
            },
            {
                'id': 'm4',
                'domain': 'leadership',
                'title': 'Women in Parliament',
                'value': '61.3%',
                'trend': '+2.8%',
                'trend_direction': 'up',
                'time_range': '2020-2024',
                'chart_data': [
                    {'x': 0, 'y': 58.3},
                    {'x': 1, 'y': 59.2},
                    {'x': 2, 'y': 60.1},
                    {'x': 3, 'y': 60.7},
                    {'x': 4, 'y': 61.3},
                ]
            },
        ]
        
        for metric_data in metrics_data:
            chart_data = metric_data.pop('chart_data')
            metric = Metric.objects.create(**metric_data)
            ChartData.objects.create(metric=metric, data=chart_data)
            self.stdout.write(self.style.SUCCESS(f'Created metric: {metric.title}'))
        
        # Create Insights
        insights_data = [
            {
                'id': 'i1',
                'insight_type': 'trend',
                'headline': 'Economic participation among women has grown steadily',
                'description': 'Women\'s participation in economic activities increased by 3.2% over the past 4 years.'
            },
            {
                'id': 'i2',
                'insight_type': 'milestone',
                'headline': 'Rwanda reaches 61% women representation in parliament',
                'description': 'Rwanda continues to lead in women representation in political leadership globally.'
            },
            {
                'id': 'i3',
                'insight_type': 'alert',
                'headline': 'Education gender parity nearly achieved',
                'description': 'Secondary school enrollment for girls has reached 68.3%, approaching parity with boys.'
            },
        ]
        
        for insight_data in insights_data:
            insight = Insight.objects.create(**insight_data)
            self.stdout.write(self.style.SUCCESS(f'Created insight: {insight.headline}'))
        
        # Create Gap Alerts
        alerts_data = [
            {
                'id': 'g1',
                'title': 'Missing rural employment data',
                'description': 'Rural women employment data missing for Q3 2024. Expected update by end of month.',
                'severity': 'warning'
            },
            {
                'id': 'g2',
                'title': 'Health data gap in western province',
                'description': 'Incomplete maternal health indicators for Western Province. Data collection in progress.',
                'severity': 'critical'
            },
            {
                'id': 'g3',
                'title': 'Updated: Election commission data available',
                'description': 'Latest women leadership statistics now available from the National Electoral Commission.',
                'severity': 'info'
            },
        ]
        
        for alert_data in alerts_data:
            alert = GapAlert.objects.create(**alert_data)
            self.stdout.write(self.style.SUCCESS(f'Created alert: {alert.title}'))
        
        # Create Detailed Indicator
        DetailedIndicator.objects.create(
            id='m1',
            title='Women Economic Participation',
            domain='economic',
            source='Rwanda National Institute of Statistics',
            last_updated=timezone.now(),
            trend_data=[
                {'year': '2020', 'national': 38.2, 'target': 45},
                {'year': '2021', 'national': 39.1, 'target': 46},
                {'year': '2022', 'national': 40.5, 'target': 47},
                {'year': '2023', 'national': 41.8, 'target': 48},
                {'year': '2024', 'national': 42.5, 'target': 50},
            ],
            disaggregation_location=[
                {'name': 'Kigali', 'value': 58.3},
                {'name': 'South Province', 'value': 42.1},
                {'name': 'West Province', 'value': 38.5},
                {'name': 'North Province', 'value': 35.2},
                {'name': 'East Province', 'value': 40.8},
            ],
            disaggregation_age=[
                {'group': '18-24', 'value': 35.2},
                {'group': '25-34', 'value': 48.5},
                {'group': '35-44', 'value': 52.1},
                {'group': '45-54', 'value': 45.3},
                {'group': '55+', 'value': 28.7},
            ],
            regional_data=[
                {'district': 'Kigali City', 'value': 58.3},
                {'district': 'Gasabo', 'value': 56.2},
                {'district': 'Nyarugenge', 'value': 60.5},
                {'district': 'Kicukiro', 'value': 54.8},
                {'district': 'Bugesera', 'value': 38.2},
                {'district': 'Rwamagana', 'value': 42.1},
                {'district': 'Huye', 'value': 40.5},
                {'district': 'Muhanga', 'value': 45.3},
            ]
        )
        self.stdout.write(self.style.SUCCESS('Created detailed indicator'))
        
        self.stdout.write(self.style.SUCCESS('âœ“ Database seeding completed successfully!'))

        # â”€â”€ Studies, Resources, Quality Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        Study.objects.all().delete()

        studies_data = [
            {
                'title': 'Rwanda Gender Disaggregated Labor Force Survey 2023',
                'abstract': 'A comprehensive national survey examining labor force participation rates disaggregated by sex, age, and geographic location across all 30 districts of Rwanda. Covers formal and informal employment, wage gaps, and sector distribution.',
                'domain': 'economic',
                'authors': ['Dr. Uwimana Claudine', 'Jean-Pierre Habimana', 'NISR Research Team'],
                'organization': 'National Institute of Statistics Rwanda (NISR)',
                'publication_date': date(2023, 11, 15),
                'geographic_scope': 'National â€” All 30 Districts',
                'keywords': ['labor force', 'employment', 'gender gap', 'wage parity', 'informal sector'],
                'methodology': 'Household Survey',
                'sample_size': 14820,
                'status': 'completed',
                'doi': '10.1234/nisr.lfs.2023',
                'resources': [
                    {'title': 'Full Survey Report', 'resource_type': 'report', 'file_format': 'pdf', 'file_size_kb': 4200, 'language': 'English', 'description': 'Complete 180-page survey report with methodology and findings.', 'is_public': True},
                    {'title': 'Microdata Dataset', 'resource_type': 'dataset', 'file_format': 'csv', 'file_size_kb': 18500, 'language': 'English', 'description': 'Anonymized household-level microdata for secondary analysis.', 'is_public': False},
                    {'title': 'Policy Brief â€” Women in the Workforce', 'resource_type': 'policy_brief', 'file_format': 'pdf', 'file_size_kb': 620, 'language': 'English', 'description': 'Key findings and policy recommendations for MIFOTRA.', 'is_public': True},
                    {'title': 'Summary Infographic', 'resource_type': 'infographic', 'file_format': 'pdf', 'file_size_kb': 380, 'language': 'Kinyarwanda', 'description': 'Visual summary of key statistics for public communication.', 'is_public': True},
                ],
                'quality': {'overall_score': 88.5, 'overall_rating': 'excellent', 'completeness_score': 92, 'accuracy_score': 90, 'timeliness_score': 85, 'consistency_score': 87, 'sex_disaggregated': True, 'age_disaggregated': True, 'geographic_disaggregated': True, 'disability_disaggregated': False, 'peer_reviewed': True, 'assessed_by': 'GDO Quality Team', 'notes': 'Disability disaggregation planned for 2025 edition.'},
            },
            {
                'title': 'Maternal Health Outcomes and Facility Access Study â€” Western Province 2023',
                'abstract': 'An in-depth study of maternal mortality, skilled birth attendance, and antenatal care coverage in Western Province. Identifies geographic and socioeconomic barriers to facility-based delivery.',
                'domain': 'health',
                'authors': ['Dr. Mukamana Solange', 'RBC Maternal Health Unit'],
                'organization': 'Rwanda Biomedical Centre (RBC) / Ministry of Health',
                'publication_date': date(2023, 8, 1),
                'geographic_scope': 'Western Province',
                'keywords': ['maternal mortality', 'antenatal care', 'skilled birth attendance', 'facility delivery', 'western province'],
                'methodology': 'Mixed Methods â€” HMIS + Qualitative',
                'sample_size': 3240,
                'status': 'completed',
                'doi': '',
                'resources': [
                    {'title': 'Research Report', 'resource_type': 'report', 'file_format': 'pdf', 'file_size_kb': 2800, 'language': 'English', 'description': 'Full research report with district-level breakdowns.', 'is_public': True},
                    {'title': 'HMIS Facility Dataset', 'resource_type': 'dataset', 'file_format': 'xlsx', 'file_size_kb': 1200, 'language': 'English', 'description': 'Facility-level HMIS data for 2021â€“2023.', 'is_public': False},
                    {'title': 'Presentation â€” MOH Review Meeting', 'resource_type': 'presentation', 'file_format': 'pptx', 'file_size_kb': 5400, 'language': 'English', 'description': 'Slides presented at the 2023 MOH annual review.', 'is_public': True},
                ],
                'quality': {'overall_score': 74.0, 'overall_rating': 'good', 'completeness_score': 78, 'accuracy_score': 80, 'timeliness_score': 72, 'consistency_score': 66, 'sex_disaggregated': True, 'age_disaggregated': True, 'geographic_disaggregated': True, 'disability_disaggregated': False, 'peer_reviewed': False, 'assessed_by': 'GDO Quality Team', 'notes': 'Consistency score reduced due to HMIS reporting gaps in 3 districts.'},
            },
            {
                'title': 'Girls Education Continuity and TVET Enrollment Parity Report 2024',
                'abstract': 'National assessment of gender parity in secondary and technical/vocational education. Examines dropout rates, transition to TVET, and barriers to girls\' continued education including distance, safety, and economic factors.',
                'domain': 'education',
                'authors': ['MINEDUC Gender Unit', 'Dr. Ingabire Vestine'],
                'organization': 'Ministry of Education (MINEDUC)',
                'publication_date': date(2024, 3, 20),
                'geographic_scope': 'National',
                'keywords': ['girls education', 'TVET', 'dropout', 'gender parity', 'secondary school'],
                'methodology': 'Administrative Data Analysis',
                'sample_size': None,
                'status': 'completed',
                'doi': '',
                'resources': [
                    {'title': 'Annual Education Statistics Report', 'resource_type': 'report', 'file_format': 'pdf', 'file_size_kb': 3100, 'language': 'English', 'description': 'Full statistical report with school-level enrollment data.', 'is_public': True},
                    {'title': 'School Census Dataset 2023/24', 'resource_type': 'dataset', 'file_format': 'xlsx', 'file_size_kb': 8900, 'language': 'English', 'description': 'School-level enrollment disaggregated by sex and grade.', 'is_public': True},
                    {'title': 'Policy Brief â€” Closing the TVET Gender Gap', 'resource_type': 'policy_brief', 'file_format': 'pdf', 'file_size_kb': 540, 'language': 'English', 'description': 'Recommendations for increasing girls\' TVET enrollment.', 'is_public': True},
                    {'title': 'Kinyarwanda Summary Brief', 'resource_type': 'policy_brief', 'file_format': 'pdf', 'file_size_kb': 490, 'language': 'Kinyarwanda', 'description': 'Translated summary for district education officers.', 'is_public': True},
                ],
                'quality': {'overall_score': 81.0, 'overall_rating': 'good', 'completeness_score': 85, 'accuracy_score': 84, 'timeliness_score': 88, 'consistency_score': 67, 'sex_disaggregated': True, 'age_disaggregated': False, 'geographic_disaggregated': True, 'disability_disaggregated': False, 'peer_reviewed': False, 'assessed_by': 'GDO Quality Team', 'notes': 'Age disaggregation not available in administrative data source.'},
            },
            {
                'title': 'Women in Leadership and Decision-Making Positions â€” Rwanda 2024',
                'abstract': 'Comprehensive mapping of women\'s representation across all levels of government, judiciary, private sector boards, and civil society leadership. Benchmarks Rwanda against SADC and global targets.',
                'domain': 'leadership',
                'authors': ['MIGEPROF Research Division', 'UN Women Rwanda'],
                'organization': 'MIGEPROF / UN Women',
                'publication_date': date(2024, 6, 5),
                'geographic_scope': 'National',
                'keywords': ['women leadership', 'parliament', 'judiciary', 'private sector', 'decision-making', 'representation'],
                'methodology': 'Institutional Data Collection',
                'sample_size': None,
                'status': 'completed',
                'doi': '10.5678/migeprof.wl.2024',
                'resources': [
                    {'title': 'Leadership Mapping Report', 'resource_type': 'report', 'file_format': 'pdf', 'file_size_kb': 2600, 'language': 'English', 'description': 'Full report with sector-by-sector analysis.', 'is_public': True},
                    {'title': 'Leadership Database (Excel)', 'resource_type': 'dataset', 'file_format': 'xlsx', 'file_size_kb': 760, 'language': 'English', 'description': 'Structured dataset of leadership positions by institution and sex.', 'is_public': True},
                    {'title': 'Infographic â€” Rwanda Leadership at a Glance', 'resource_type': 'infographic', 'file_format': 'pdf', 'file_size_kb': 420, 'language': 'English', 'description': 'One-page visual summary for communications.', 'is_public': True},
                ],
                'quality': {'overall_score': 91.5, 'overall_rating': 'excellent', 'completeness_score': 95, 'accuracy_score': 93, 'timeliness_score': 90, 'consistency_score': 88, 'sex_disaggregated': True, 'age_disaggregated': False, 'geographic_disaggregated': True, 'disability_disaggregated': False, 'peer_reviewed': True, 'assessed_by': 'GDO Quality Team', 'notes': 'Highest quality score in current dataset. Recommended as reference study.'},
            },
            {
                'title': 'GBV Incidence and Reporting Barriers â€” National Study 2023',
                'abstract': 'Mixed-methods study examining gender-based violence incidence rates, reporting barriers, and survivor support service access across Rwanda. Includes qualitative testimonies and quantitative police/health facility data.',
                'domain': 'crossCutting',
                'authors': ['RNP Gender Desk', 'RBC', 'MIGEPROF', 'UNFPA Rwanda'],
                'organization': 'MIGEPROF / UNFPA',
                'publication_date': date(2023, 12, 10),
                'geographic_scope': 'National',
                'keywords': ['GBV', 'gender-based violence', 'reporting', 'survivor support', 'police', 'health facilities'],
                'methodology': 'Mixed Methods',
                'sample_size': 5600,
                'status': 'completed',
                'doi': '',
                'resources': [
                    {'title': 'GBV Study Full Report', 'resource_type': 'report', 'file_format': 'pdf', 'file_size_kb': 5100, 'language': 'English', 'description': 'Comprehensive report including survivor testimonies and quantitative analysis.', 'is_public': True},
                    {'title': 'Incident Data â€” Anonymized', 'resource_type': 'dataset', 'file_format': 'csv', 'file_size_kb': 3200, 'language': 'English', 'description': 'Anonymized incident-level data from RNP and health facilities.', 'is_public': False},
                    {'title': 'Policy Brief â€” Strengthening GBV Response', 'resource_type': 'policy_brief', 'file_format': 'pdf', 'file_size_kb': 580, 'language': 'English', 'description': 'Recommendations for unified GBV data management system.', 'is_public': True},
                ],
                'quality': {'overall_score': 62.0, 'overall_rating': 'fair', 'completeness_score': 55, 'accuracy_score': 70, 'timeliness_score': 68, 'consistency_score': 55, 'sex_disaggregated': True, 'age_disaggregated': True, 'geographic_disaggregated': False, 'disability_disaggregated': False, 'peer_reviewed': False, 'assessed_by': 'GDO Quality Team', 'notes': 'Low completeness due to significant underreporting. Geographic disaggregation limited by data sensitivity.'},
            },
            {
                'title': 'MINECOFIN Gender Budget Statement Analysis â€” FY 2023/24',
                'abstract': 'Analysis of Rwanda\'s Gender Budget Statements across all ministries for fiscal year 2023/24. Tracks allocation, execution rates, and gender-tagging methodology against NST1 targets.',
                'domain': 'finance',
                'authors': ['MINECOFIN Budget Department', 'Dr. Nkurunziza Eric'],
                'organization': 'Ministry of Finance and Economic Planning (MINECOFIN)',
                'publication_date': date(2024, 9, 1),
                'geographic_scope': 'National',
                'keywords': ['gender budget', 'GBS', 'budget execution', 'NST1', 'MINECOFIN', 'fiscal policy'],
                'methodology': 'Budget Analysis',
                'sample_size': None,
                'status': 'completed',
                'doi': '',
                'resources': [
                    {'title': 'Gender Budget Statement 2023/24', 'resource_type': 'report', 'file_format': 'pdf', 'file_size_kb': 3800, 'language': 'English', 'description': 'Official GBS document covering all 29 ministries.', 'is_public': True},
                    {'title': 'Budget Execution Data', 'resource_type': 'dataset', 'file_format': 'xlsx', 'file_size_kb': 1400, 'language': 'English', 'description': 'Ministry-level budget allocation and execution figures.', 'is_public': True},
                    {'title': 'NST1 Gender Targets Tracker', 'resource_type': 'dataset', 'file_format': 'xlsx', 'file_size_kb': 680, 'language': 'English', 'description': 'Progress tracking against NST1 gender budget targets.', 'is_public': True},
                    {'title': 'Policy Brief â€” Closing the Budget Execution Gap', 'resource_type': 'policy_brief', 'file_format': 'pdf', 'file_size_kb': 510, 'language': 'English', 'description': 'Recommendations for improving gender budget execution rates.', 'is_public': True},
                ],
                'quality': {'overall_score': 85.0, 'overall_rating': 'excellent', 'completeness_score': 90, 'accuracy_score': 88, 'timeliness_score': 82, 'consistency_score': 80, 'sex_disaggregated': False, 'age_disaggregated': False, 'geographic_disaggregated': False, 'disability_disaggregated': False, 'peer_reviewed': False, 'assessed_by': 'GDO Quality Team', 'notes': 'Budget data by nature is not sex-disaggregated at individual level.'},
            },
        ]

        for s in studies_data:
            resources = s.pop('resources')
            quality = s.pop('quality')
            study = Study.objects.create(**s)
            for r in resources:
                StudyResource.objects.create(study=study, **r)
            QualityReport.objects.create(study=study, **quality)
            self.stdout.write(self.style.SUCCESS(f'Created study: {study.title[:60]}...'))

        self.stdout.write(self.style.SUCCESS('âœ“ Studies, resources, and quality reports seeded!'))

