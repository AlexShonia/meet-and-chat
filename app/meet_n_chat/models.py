from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from uuid import uuid4
from django.core.validators import validate_email


class ChatQueue(models.Model):
    group_name = models.CharField(max_length=100, unique=True)
    channel_name = models.CharField(max_length=100, unique=True)
    user_id = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=32)
    chat_color = models.CharField(max_length=7)
    logged_in = models.BooleanField(default=False)


class VoiceChatQueue(models.Model):
    group_name = models.CharField(max_length=100, unique=True)
    channel_name = models.CharField(max_length=100, unique=True)
    user_id = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=32)
    chat_color = models.CharField(max_length=7)
    logged_in = models.BooleanField(default=False)


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, username, email, password=None, role="user", **extra_fields):
        validate_email(email)
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, role=role, **extra_fields)
        if role == "admin":
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_user(self, username, email, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)

        return self._create_user(username, email, **extra_fields)

    def create_superuser(self, username, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        role = "admin"
        return self._create_user(username, email, password, role, **extra_fields)


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    username = models.CharField(
        max_length=32,
    )
    email = models.EmailField(
        verbose_name="email address",
        max_length=255,
        unique=True,
    )
    objects = UserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Role(models.TextChoices):
        User = "user"
        Manager = "manager"
        Admin = "admin"

    role = models.CharField(max_length=32, choices=Role.choices, default=Role.User)
