"""
Database models for API
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Metric(models.Model):
    """Summary metric for dashboard overview"""
    DOMAIN_CHOICES = [
        ('economic', 'Economic'),
        ('health', 'Health'),
        ('education', 'Education'),
        ('leadership', 'Leadership'),
        ('crossCutting', 'Cross-Cutting'),
    ]
    
    TREND_DIRECTION_CHOICES = [
        ('up', 'Up'),
        ('down', 'Down'),
        ('neutral', 'Neutral'),
    ]
    
    id = models.CharField(max_length=50, primary_key=True)
    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES)
    title = models.CharField(max_length=200)
    value = models.CharField(max_length=50)  # e.g., "45.8%"
    trend = models.CharField(max_length=50)  # e.g., "+2.3%"
    trend_direction = models.CharField(max_length=20, choices=TREND_DIRECTION_CHOICES)
    time_range = models.CharField(max_length=50)  # e.g., "2020-2024"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['domain', 'title']
    
    def __str__(self):
        return self.title


class ChartData(models.Model):
    """Mini chart data for metrics"""
    metric = models.OneToOneField(Metric, on_delete=models.CASCADE, related_name='chart_data')
    data = models.JSONField(default=list)  # [{"x": 1, "y": 10}, ...]
    
    def __str__(self):
        return f"Chart data for {self.metric.title}"


class Insight(models.Model):
    """AI-generated insights"""
    id = models.CharField(max_length=50, primary_key=True)
    insight_type = models.CharField(max_length=100)
    headline = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.headline


class GapAlert(models.Model):
    """Data gap and alert notifications"""
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('warning', 'Warning'),
        ('info', 'Info'),
    ]
    
    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class Study(models.Model):
    """A research study or data collection effort on gender indicators"""
    DOMAIN_CHOICES = [
        ('economic', 'Economic'),
        ('health', 'Health'),
        ('education', 'Education'),
        ('leadership', 'Leadership'),
        ('crossCutting', 'Cross-Cutting'),
        ('finance', 'Finance & Budgeting'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
        ('ongoing', 'Ongoing'),
    ]

    title = models.CharField(max_length=300)
    abstract = models.TextField()
    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES)
    authors = models.JSONField(default=list)          # ["Name", ...]
    organization = models.CharField(max_length=200)
    publication_date = models.DateField()
    geographic_scope = models.CharField(max_length=200, default='National')  # e.g. "National", "Kigali"
    keywords = models.JSONField(default=list)          # ["keyword", ...]
    methodology = models.CharField(max_length=200, blank=True)
    sample_size = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    doi = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-publication_date']
        verbose_name_plural = 'Studies'

    def __str__(self):
        return self.title


class StudyResource(models.Model):
    """A file or link resource attached to a Study"""
    RESOURCE_TYPE_CHOICES = [
        ('report', 'Report'),
        ('dataset', 'Dataset'),
        ('presentation', 'Presentation'),
        ('policy_brief', 'Policy Brief'),
        ('infographic', 'Infographic'),
        ('video', 'Video'),
        ('other', 'Other'),
    ]
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('xlsx', 'Excel'),
        ('csv', 'CSV'),
        ('pptx', 'PowerPoint'),
        ('mp4', 'Video'),
        ('url', 'Web Link'),
        ('other', 'Other'),
    ]

    study = models.ForeignKey(Study, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=300)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)
    file_format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')
    url = models.URLField(blank=True)
    file_size_kb = models.PositiveIntegerField(null=True, blank=True)
    language = models.CharField(max_length=50, default='English')
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    download_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['resource_type', 'title']

    def __str__(self):
        return f"{self.study.title} — {self.title}"


class QualityReport(models.Model):
    """Data quality assessment for a Study"""
    RATING_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]

    study = models.OneToOneField(Study, on_delete=models.CASCADE, related_name='quality_report')
    overall_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    overall_rating = models.CharField(max_length=20, choices=RATING_CHOICES)
    completeness_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    accuracy_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    timeliness_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    consistency_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    sex_disaggregated = models.BooleanField(default=False)
    age_disaggregated = models.BooleanField(default=False)
    geographic_disaggregated = models.BooleanField(default=False)
    disability_disaggregated = models.BooleanField(default=False)
    peer_reviewed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    assessed_by = models.CharField(max_length=200, blank=True)
    assessed_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Quality Report: {self.study.title} ({self.overall_rating})"


class DetailedIndicator(models.Model):
    """Detailed indicator with disaggregated data"""
    DOMAIN_CHOICES = [
        ('economic', 'Economic'),
        ('health', 'Health'),
        ('education', 'Education'),
        ('leadership', 'Leadership'),
    ]
    
    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=200)
    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES)
    source = models.CharField(max_length=200)
    last_updated = models.DateTimeField()
    trend_data = models.JSONField(default=list)  # [{"year": 2020, "national": 45, "target": 50}, ...]
    disaggregation_location = models.JSONField(default=list)  # [{"name": "Kigali", "value": 60}, ...]
    disaggregation_age = models.JSONField(default=list)  # [{"group": "18-24", "value": 55}, ...]
    regional_data = models.JSONField(default=list)  # [{"district": "Kigali", "value": 60}, ...]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Detailed Indicators"
    
    def __str__(self):
        return self.title
