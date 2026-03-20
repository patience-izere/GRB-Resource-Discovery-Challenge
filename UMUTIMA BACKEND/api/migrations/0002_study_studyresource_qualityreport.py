from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Study',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=300)),
                ('abstract', models.TextField()),
                ('domain', models.CharField(choices=[
                    ('economic', 'Economic'), ('health', 'Health'),
                    ('education', 'Education'), ('leadership', 'Leadership'),
                    ('crossCutting', 'Cross-Cutting'), ('finance', 'Finance & Budgeting'),
                ], max_length=20)),
                ('authors', models.JSONField(default=list)),
                ('organization', models.CharField(max_length=200)),
                ('publication_date', models.DateField()),
                ('geographic_scope', models.CharField(default='National', max_length=200)),
                ('keywords', models.JSONField(default=list)),
                ('methodology', models.CharField(blank=True, max_length=200)),
                ('sample_size', models.PositiveIntegerField(blank=True, null=True)),
                ('status', models.CharField(choices=[
                    ('active', 'Active'), ('completed', 'Completed'),
                    ('archived', 'Archived'), ('ongoing', 'Ongoing'),
                ], default='completed', max_length=20)),
                ('doi', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-publication_date'], 'verbose_name_plural': 'Studies'},
        ),
        migrations.CreateModel(
            name='StudyResource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('study', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='resources', to='api.study')),
                ('title', models.CharField(max_length=300)),
                ('resource_type', models.CharField(choices=[
                    ('report', 'Report'), ('dataset', 'Dataset'),
                    ('presentation', 'Presentation'), ('policy_brief', 'Policy Brief'),
                    ('infographic', 'Infographic'), ('video', 'Video'), ('other', 'Other'),
                ], max_length=20)),
                ('file_format', models.CharField(choices=[
                    ('pdf', 'PDF'), ('xlsx', 'Excel'), ('csv', 'CSV'),
                    ('pptx', 'PowerPoint'), ('mp4', 'Video'), ('url', 'Web Link'), ('other', 'Other'),
                ], default='pdf', max_length=10)),
                ('url', models.URLField(blank=True)),
                ('file_size_kb', models.PositiveIntegerField(blank=True, null=True)),
                ('language', models.CharField(default='English', max_length=50)),
                ('description', models.TextField(blank=True)),
                ('is_public', models.BooleanField(default=True)),
                ('download_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['resource_type', 'title']},
        ),
        migrations.CreateModel(
            name='QualityReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('study', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='quality_report', to='api.study')),
                ('overall_score', models.FloatField()),
                ('overall_rating', models.CharField(choices=[
                    ('excellent', 'Excellent'), ('good', 'Good'),
                    ('fair', 'Fair'), ('poor', 'Poor'),
                ], max_length=20)),
                ('completeness_score', models.FloatField()),
                ('accuracy_score', models.FloatField()),
                ('timeliness_score', models.FloatField()),
                ('consistency_score', models.FloatField()),
                ('sex_disaggregated', models.BooleanField(default=False)),
                ('age_disaggregated', models.BooleanField(default=False)),
                ('geographic_disaggregated', models.BooleanField(default=False)),
                ('disability_disaggregated', models.BooleanField(default=False)),
                ('peer_reviewed', models.BooleanField(default=False)),
                ('notes', models.TextField(blank=True)),
                ('assessed_by', models.CharField(blank=True, max_length=200)),
                ('assessed_at', models.DateTimeField(default=django.utils.timezone.now)),
            ],
        ),
    ]
