import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels_redis.core import RedisChannelLayer

from urllib.parse import parse_qs


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_layer: RedisChannelLayer
        query_string = self.scope["query_string"].decode()
        query_params = parse_qs(query_string)
        self.username = query_params.get("username", [None])[0]

        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat.message", "message": "", "user": self.username, "event": "join"},
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat.message", "message": "", "user": self.username, "event": "leave"},
        )

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat.message", "message": message, "user": self.username, "event": "message"},
        )

    async def chat_message(self, event):
        message = event["message"]
        user = event["user"]
        chat_event = event["event"]

        await self.send(text_data=json.dumps({"message": message, "user": user, "event": chat_event}))
