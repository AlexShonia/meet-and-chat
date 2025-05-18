import json
from uuid import uuid4

from channels.generic.websocket import AsyncWebsocketConsumer
from channels_redis.core import RedisChannelLayer

from app.meet_n_chat.utils import (
    pick_random_color,
    delete_chat_queue,
    delete_voice_chat_queue,
    handle_start,
    handle_stop,
    handle_default,
)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_layer: RedisChannelLayer
        session = self.scope["session"]
        # Perhaps we dont store these inside this object?
        self.username = session.get("username")
        self.user_id = session.get("user_id")
        self.chat_color = pick_random_color()

        self.room_group_name = f"chat_{uuid4().hex}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": "",
                "user": self.username,
                "event": "info",
                "chat_color": self.chat_color,
            },
        )

    async def disconnect(self, close_code):
        await handle_stop(self, "voice")

        await delete_chat_queue(self.user_id)
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        type = text_data_json.get("type")

        match type:
            case "start":
                await handle_start(self)
            case "stop":
                await handle_stop(self)
            case default:
                await handle_default(self, text_data_json, type)

    async def chat_message(self, event):
        message = event["message"]
        user = event["user"]
        chat_event = event["event"]
        chat_color = event["chat_color"]

        await self.send(
            text_data=json.dumps(
                {
                    "message": message,
                    "user": user,
                    "event": chat_event,
                    "chat_color": chat_color,
                }
            )
        )


class VoiceChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_layer: RedisChannelLayer
        session = self.scope["session"]
        # Perhaps we dont store these inside this object?
        self.username = session.get("username")
        self.user_id = session.get("user_id")
        self.chat_color = pick_random_color()

        self.room_group_name = f"chat_{uuid4().hex}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": "",
                "user": self.username,
                "event": "info",
                "chat_color": self.chat_color,
            },
        )

    async def disconnect(self, close_code):
        await handle_stop(self, "voice")

        await delete_voice_chat_queue(self.user_id)
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        type = text_data_json.get("type")

        match type:
            case "start":
                await handle_start(self, "voice")
            case "stop":
                await handle_stop(self, "voice")
            case "offer":
                offer = text_data_json.get("offer")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat.message",
                        "offer": offer,
                    },
                )
            case "answer":
                answer = text_data_json.get("answer")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat.message",
                        "answer": answer,
                    },
                )
            case "ice_candidate":
                ice_candidate = text_data_json.get("new-ice-candidate")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat.message",
                        "iceCandidate": ice_candidate,
                    },
                )
            case default:
                await handle_default(self, text_data_json, type)

    async def chat_message(self, event):
        message = event.get("message")
        user = event.get("user")
        user_id = event.get("user_id")
        chat_event = event.get("event")
        chat_color = event.get("chat_color")
        offer = event.get("offer")
        answer = event.get("answer")
        ice_candidate = event.get("iceCandidate")

        if offer:
            await self.send(
                text_data=json.dumps(
                    {
                        "offer": offer,
                    }
                )
            )
        elif answer:
            await self.send(
                text_data=json.dumps(
                    {
                        "answer": answer,
                    }
                )
            )
        elif ice_candidate:
            await self.send(
                text_data=json.dumps(
                    {
                        "iceCandidate": ice_candidate,
                    }
                )
            )
        else:
            await self.send(
                text_data=json.dumps(
                    {
                        "message": message,
                        "user": user,
                        "user_id": user_id,
                        "event": chat_event,
                        "chat_color": chat_color,
                    }
                )
            )
