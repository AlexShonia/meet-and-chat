# Generated by Django 5.2.1 on 2025-05-12 12:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('meet_n_chat', '0004_alter_chatqueue_group_name_alter_chatqueue_user_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='VoiceChatQueue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('group_name', models.CharField(max_length=100, unique=True)),
                ('user_id', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.AlterField(
            model_name='chatqueue',
            name='user_id',
            field=models.CharField(max_length=100, unique=True),
        ),
    ]
