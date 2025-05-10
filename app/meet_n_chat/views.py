from django.shortcuts import render, redirect
from django.http import HttpRequest
from uuid import uuid4


def index(request: HttpRequest):
    return render(request, "index/index.html")


def choose(request: HttpRequest):
    username = request.POST["username"]
    request.session["username"] = username
    request.session["user_id"] = uuid4().hex

    return render(request, "chat/choose.html")


def room(request: HttpRequest):
    username = request.session.get("username")
    if not username:
        return redirect('index')
    return render(request, "chat/room.html")
