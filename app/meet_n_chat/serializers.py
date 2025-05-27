from rest_framework import serializers
from app.meet_n_chat.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username"]
        read_only_fields = ["email"]
