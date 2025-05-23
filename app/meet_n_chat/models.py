from django.db import models

class ChatQueue(models.Model):
    group_name = models.CharField(max_length=100, unique=True)
    channel_name = models.CharField(max_length=100, unique=True)
    user_id = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=32)
    chat_color = models.CharField(max_length=7)

class VoiceChatQueue(models.Model):
    group_name = models.CharField(max_length=100, unique=True)
    channel_name = models.CharField(max_length=100, unique=True)
    user_id = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=32)
    chat_color = models.CharField(max_length=7)