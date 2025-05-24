import json
import asyncio
from uuid import uuid4

from channels.generic.websocket import AsyncWebsocketConsumer
from channels_redis.core import RedisChannelLayer

from app.meet_n_chat.utils import (
    pick_random_color,
    handle_start,
    handle_stop,
    handle_image_consent,
    handle_default,
    cleanup_user_images
)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_layer: RedisChannelLayer
        session = self.scope["session"]
        # Perhaps we dont store these inside this object?
        self.username = session.get("username")
        self.user_id = session.get("user_id")
        self.chat_color = pick_random_color()
        self.image_consent = False

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
        asyncio.create_task(cleanup_user_images(self))


    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        type = text_data_json.get("type")

        match type:
            case "start":
                await handle_start(self)
            case "stop":
                await handle_stop(self)
            case "consent":
                await handle_image_consent(self, text_data_json, type)
            case default:
                await handle_default(self, text_data_json, type)

    async def chat_message(self, event):
        message = event.get("message")
        user = event.get("user")
        channel_name = event.get("channel_name")
        user_id = event.get("user_id")
        chat_event = event.get("event")
        chat_color = event.get("chat_color")
        second_user = event.get("second_user")
        second_channel_name = event.get("second_channel_name")
        second_user_color = event.get("second_user_color")

        if second_user:
            await self.send(
                text_data=json.dumps(
                    {
                        "message": message,
                        "user": user,
                        "user_id": user_id,
                        "channel_name": channel_name,
                        "second_user": second_user,
                        "second_channel_name": second_channel_name,
                        "second_user_color": second_user_color,
                        "event": chat_event,
                        "chat_color": chat_color,
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

    async def update_image_consent(self, event):
        self.image_consent = event.get("consent")


class VoiceChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_layer: RedisChannelLayer
        session = self.scope["session"]
        # Perhaps we dont store these inside this object?
        self.username = session.get("username")
        self.user_id = session.get("user_id")
        self.chat_color = pick_random_color()
        self.image_consent = False

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

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        type = text_data_json.get("type")

        match type:
            case "start":
                await handle_start(self, "voice")
            case "stop":
                await handle_stop(self, "voice")
            case "consent":
                await handle_image_consent(self, text_data_json, type)
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
        second_user = event.get("second_user")
        second_user_color = event.get("second_user_color")
        channel_name = event.get("channel_name")
        second_channel_name = event.get("second_channel_name")

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
        elif second_user:
            await self.send(
                text_data=json.dumps(
                    {
                        "message": message,
                        "user": user,
                        "user_id": user_id,
                        "channel_name": channel_name,
                        "second_user": second_user,
                        "second_channel_name": second_channel_name,
                        "second_user_color": second_user_color,
                        "event": chat_event,
                        "chat_color": chat_color,
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

    async def update_image_consent(self, event):
        self.image_consent = event.get("consent")
