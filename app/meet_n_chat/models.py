from django.db import models

# Create your models here.

class ChatQueue(models.Model):
    group_name = models.CharField(max_length=100, unique=True)
    user_id = models.CharField(max_length=100, unique=True)

class VoiceChatQueue(models.Model):
    group_name = models.CharField(max_length=100, unique=True)
    user_id = models.CharField(max_length=100, unique=True)