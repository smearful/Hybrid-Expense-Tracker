from django.contrib.auth.models import Group, User
from rest_framework import serializers
from .models import Expense, Object

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class ObjectSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(read_only=True)
    details = serializers.JSONField()

    class Meta:
        model = Object
        fields = ['_id', 'name', 'details']