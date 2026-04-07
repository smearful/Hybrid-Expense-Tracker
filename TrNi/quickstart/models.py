from django.db import models
from djongo import models as djongo_models

class Expense(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    date = models.DateField(auto_now_add=True)
    description = models.TextField(blank=True)

class Object(models.Model):
    _id = djongo_models.ObjectIdField()
    name = models.CharField(max_length=100)
    details = djongo_models.JSONField()
