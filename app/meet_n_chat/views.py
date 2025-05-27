from django.shortcuts import render, redirect
from django.conf import settings
from rest_framework import status, serializers, mixins, viewsets, permissions
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.decorators import action
from uuid import uuid4
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from django.contrib.auth import login, get_user_model, logout
from app.meet_n_chat.models import User
from app.meet_n_chat.serializers import UserSerializer


from app.meet_n_chat.google import (
    GoogleLoginFlowService,
)


class PublicApi(APIView):
    permission_classes = ()


class IndexView(PublicApi):
    def get(self, request):
        return render(request, "index.html")


class ChooseView(PublicApi):
    def post(self, request: Request):
        username = request.data.get("username")
        if len(username) < 1:
            return Response(
                {"message": "Enter your username!"}, status=status.HTTP_400_BAD_REQUEST
            )
        request.session["username"] = username
        request.session["user_id"] = uuid4().hex

        return render(request, "choose.html")

    def get(self, request: Request):
        if request.user.is_authenticated:
            user_id = request.user.id.hex
            logged_in = True
            request.session["username"] = request.user.username
            request.session["user_id"] = user_id
        else:
            username = request.session.get("username")
            user_id = request.session.get("user_id")
            logged_in = False
            if not username or not user_id:
                return redirect("index")

        return render(
            request, "choose.html", {"user_id": user_id, "logged_in": logged_in}
        )


class ChatView(PublicApi):
    def get(self, request: Request):
        username = request.session.get("username")
        user_id = request.session.get("user_id")

        if not username or not user_id:
            return redirect("index")
        return render(request, "chat.html", {"user_id": user_id})


class FileUploadView(PublicApi):
    parser_classes = (MultiPartParser,)

    def post(self, request, format=None):
        if "filename" not in request.FILES:
            return Response(
                {"detail": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST
            )

        up_file = request.FILES["filename"]
        import os

        file_path = os.path.join(settings.MEDIA_ROOT, up_file.name)
        with open(file_path, "wb+") as destination:
            for chunk in up_file.chunks():
                destination.write(chunk)

        file_url = f"{settings.MEDIA_URL}{up_file.name}"
        return Response({"file": file_url}, status=status.HTTP_201_CREATED)


class VoiceChatView(PublicApi):
    def get(self, request: Request):
        username = request.session.get("username")
        user_id = request.session.get("user_id")

        if not username or not user_id:
            return redirect("index")
        return render(request, "voice-chat.html", {"user_id": user_id})


class GoogleLoginRedirectApi(PublicApi):
    def get(self, request, *args, **kwargs):
        google_login_flow = GoogleLoginFlowService()

        authorization_url, state = google_login_flow.get_authorization_url()

        request.session["google_oauth2_state"] = state

        return redirect(authorization_url)


class GoogleLoginApi(PublicApi):
    class InputSerializer(serializers.Serializer):
        code = serializers.CharField(required=False)
        error = serializers.CharField(required=False)
        state = serializers.CharField(required=False)

    def get(self, request, *args, **kwargs):
        input_serializer = self.InputSerializer(data=request.GET)
        input_serializer.is_valid(raise_exception=True)

        validated_data = input_serializer.validated_data

        code = validated_data.get("code")
        error = validated_data.get("error")
        state = validated_data.get("state")

        if error is not None:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        if code is None or state is None:
            return Response(
                {"error": "Code and state are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_state = request.session.get("google_oauth2_state")

        if session_state is None:
            return Response(
                {"error": "CSRF check failed."}, status=status.HTTP_400_BAD_REQUEST
            )

        del request.session["google_oauth2_state"]

        if state != session_state:
            return Response(
                {"error": "CSRF check failed."}, status=status.HTTP_400_BAD_REQUEST
            )

        google_login_flow = GoogleLoginFlowService()

        google_tokens = google_login_flow.get_tokens(code=code)

        id_token_decoded = google_tokens.decode_id_token()
        user_email = id_token_decoded["email"]
        User = get_user_model()

        user, created = User.objects.get_or_create(
            email=user_email,
            defaults={
                "username": uuid4().hex,
            },
        )

        if created:
            user.set_unusable_password()
            user.save()

        login(request, user)
        request.session.save()

        return redirect("choose")


class UserViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = ()
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(methods=["POST"], detail=False, url_path="logout")
    def userLogout(self, request, *args, **kwargs):
        logout(request)
        return Response(data={"redirect_url": "/"}, status=status.HTTP_200_OK)
