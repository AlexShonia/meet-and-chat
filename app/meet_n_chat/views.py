from django.shortcuts import render, redirect
from django.http import HttpRequest
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from uuid import uuid4


def index(request: HttpRequest):
    return render(request, "index/index.html")


@api_view(["GET", "POST"])
def choose(request: HttpRequest):
    username = request.POST["username"]
    if len(username) < 1:
        return Response({"message": "Enter your username!"}, status=status.HTTP_400_BAD_REQUEST)
    request.session["username"] = username
    request.session["user_id"] = uuid4().hex

    return render(request, "chat/choose.html")


def room(request: HttpRequest):
    username = request.session.get("username")
    if not username:
        return redirect('index')
    return render(request, "chat/room.html")
