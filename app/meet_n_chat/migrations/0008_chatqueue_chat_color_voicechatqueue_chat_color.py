# Generated by Django 5.2.1 on 2025-05-20 10:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('meet_n_chat', '0007_chatqueue_username'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatqueue',
            name='chat_color',
            field=models.CharField(default='23', max_length=7),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='voicechatqueue',
            name='chat_color',
            field=models.CharField(default='23', max_length=7),
            preserve_default=False,
        ),
    ]
