import json
from uuid import uuid4

from channels.generic.websocket import AsyncWebsocketConsumer
from channels_redis.core import RedisChannelLayer

from app.meet_n_chat.utils import (
    pick_random_color,
    pop_chat_queue,
    add_chat_queue,
    delete_chat_queue,
    pop_voice_chat_queue,
    add_voice_chat_queue,
    delete_voice_chat_queue,
)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_layer: RedisChannelLayer
        session = self.scope["session"]
        # Perhaps we dont store these inside this object?
        self.username = session.get("username")
        self.user_id = session.get("user_id")
        self.chat_color = pick_random_color()

        user_id, group_name = await pop_chat_queue()
        if group_name and user_id != self.user_id:
            self.room_group_name = group_name

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message",
                    "message": "",
                    "user": self.username,
                    "event": "join",
                    "chat_color": self.chat_color,
                },
            )
        else:
            self.room_group_name = f"chat_{uuid4().hex}"
            await add_chat_queue(self.room_group_name, self.user_id)

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message",
                    "message": "",
                    "user": self.username,
                    "event": "searching",
                    "chat_color": self.chat_color,
                },
            )

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": "",
                "user": self.username,
                "event": "leave",
                "chat_color": self.chat_color,
            },
        )

        await delete_chat_queue(self.user_id)
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        message = text_data_json.get("message")
        type = text_data_json.get("type")

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": message,
                "user": self.username,
                "event": "image" if type == "image" else "message",
                "chat_color": self.chat_color,
            },
        )

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

        # user_id, group_name = await pop_voice_chat_queue()
        # if group_name and user_id != self.user_id:
        #     self.room_group_name = group_name

        #     await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        #     await self.accept()

            # await self.channel_layer.group_send(
            #     self.room_group_name,
            #     {
            #         "type": "voice.chat.message",
            #         "message": "",
            #         "user": self.username,
            #         "user_id": self.user_id,
            #         "event": "join",
            #         "chat_color": self.chat_color,
            #     },
            # )
        # else:
        #     await add_voice_chat_queue(self.room_group_name, self.user_id)

        self.room_group_name = f"chat_{uuid4().hex}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "voice.chat.message",
                "message": "",
                "user": self.username,
                "event": "info",
                "chat_color": self.chat_color,
            },
        )

            # await self.channel_layer.group_send(
            #     self.room_group_name,
            #     {
            #         "type": "voice.chat.message",
            #         "message": "",
            #         "user": self.username,
            #         "event": "searching",
            #         "chat_color": self.chat_color,
            #     },
            # )

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "voice.chat.message",
                "message": "",
                "user": self.username,
                "event": "leave",
                "chat_color": self.chat_color,
            },
        )

        await delete_voice_chat_queue(self.user_id)
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):

        text_data_json = json.loads(text_data)
        message = text_data_json.get("message")
        type = text_data_json.get("type")
        offer = text_data_json.get("offer")
        answer = text_data_json.get("answer")
        ice_candidate = text_data_json.get("new-ice-candidate")

        if type == "start":
            user_id, group_name = await pop_voice_chat_queue()
            if group_name and user_id != self.user_id:
                self.room_group_name = group_name
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "voice.chat.message",
                        "message": "",
                        "user": self.username,
                        "user_id": self.user_id,
                        "event": "join",
                        "chat_color": self.chat_color,
                    },
                )
            else:
                self.room_group_name = f"chat_{uuid4().hex}"
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                await add_voice_chat_queue(self.room_group_name, self.user_id)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "voice.chat.message",
                        "message": "",
                        "user": self.username,
                        "user_id": self.user_id,
                        "event": "start",
                        "chat_color": self.chat_color,
                    },
                )
            return
        elif type == "stop":
            await delete_voice_chat_queue(self.user_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "voice.chat.message",
                    "message": "",
                    "user": self.username,
                    "user_id": self.user_id,
                    "event": "stop",
                    "chat_color": self.chat_color,
                },
            )
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            self.room_group_name = f"chat_{uuid4().hex}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            return


        if offer:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "voice.chat.message",
                    "offer": offer,
                },
            )
        elif answer:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "voice.chat.message",
                    "answer": answer,
                },
            )
        elif ice_candidate:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "voice.chat.message",
                    "iceCandidate": ice_candidate,
                },
            )
        else:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "voice.chat.message",
                    "message": message,
                    "user": self.username,
                    "event": "image" if type == "image" else "message",
                    "chat_color": self.chat_color,
                },
            )

    async def voice_chat_message(self, event):
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
