import os
import random
from uuid import uuid4
import asyncio

from django.conf import settings
from app.meet_n_chat.models import ChatQueue, VoiceChatQueue
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


@database_sync_to_async
def pop_chat_queue():
    queue = ChatQueue.objects.all()
    if queue.count() > 0:
        queue_row = queue.values()[0]
        queue[0].delete()
        return queue_row
    return {}


@database_sync_to_async
def add_chat_queue(room_group_name, user_id, username, chat_color, channel_name):
    ChatQueue.objects.create(
        group_name=room_group_name,
        user_id=user_id,
        username=username,
        chat_color=chat_color,
        channel_name=channel_name,
    )


@database_sync_to_async
def delete_chat_queue(user_id):
    ChatQueue.objects.filter(user_id=user_id).delete()


@database_sync_to_async
def pop_voice_chat_queue():
    queue = VoiceChatQueue.objects.all()
    if queue.count() > 0:
        queue_row = queue.values()[0]
        queue[0].delete()
        return queue_row
    return {}


@database_sync_to_async
def add_voice_chat_queue(room_group_name, user_id, username, chat_color, channel_name):
    VoiceChatQueue.objects.create(
        group_name=room_group_name,
        user_id=user_id,
        username=username,
        chat_color=chat_color,
        channel_name=channel_name,
    )


@database_sync_to_async
def delete_voice_chat_queue(user_id):
    VoiceChatQueue.objects.filter(user_id=user_id).delete()


def pick_random_color():
    return complementary_colors[random.randint(0, len(complementary_colors) - 1)]


complementary_colors = [
    "#FF6B6B",
    "#FFB86C",
    "#FAD02E",
    "#7CFB7C",
    "#50FA7B",
    "#00FFAE",
    "#8BE9FD",
    "#00D2FF",
    "#2E64FA",
    "#A78BFA",
    "#B57CFB",
    "#FF79C6",
    "#FF69B4",
    "#FF5555",
    "#F8C291",
    "#FF9FF3",
    "#6C5CE7",
    "#341f97",
    "#48dbfb",
    "#1dd1a1",
    "#feca57",
    "#ff6b81",
    "#ee5253",
    "#5f27cd",
    "#54a0ff",
    "#00cec9",
    "#fab1a0",
    "#ffeaa7",
    "#a29bfe",
    "#fd79a8",
    "#e17055",
    "#00b894",
    "#0984e3",
    "#6ab04c",
    "#c44569",
]


async def handle_start(self: AsyncWebsocketConsumer, consumer="chat"):
    queue_row = (
        await pop_voice_chat_queue() if consumer == "voice" else await pop_chat_queue()
    )
    user_id = queue_row.get("user_id")
    username = queue_row.get("username")
    group_name = queue_row.get("group_name")
    channel_name = queue_row.get("channel_name")
    chat_color = queue_row.get("chat_color")

    if group_name and user_id != self.user_id:
        self.room_group_name = group_name
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": "",
                "user": self.username,
                "channel_name": self.channel_name,
                "second_user": username,
                "second_channel_name": channel_name,
                "second_user_color": chat_color,
                "user_id": self.user_id,
                "event": "join",
                "chat_color": self.chat_color,
            },
        )
    else:
        self.room_group_name = f"chat_{uuid4().hex}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        (
            await add_voice_chat_queue(
                self.room_group_name,
                self.user_id,
                self.username,
                self.chat_color,
                self.channel_name,
            )
            if consumer == "voice"
            else await add_chat_queue(
                self.room_group_name,
                self.user_id,
                self.username,
                self.chat_color,
                self.channel_name,
            )
        )
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": "",
                "user": self.username,
                "user_id": self.user_id,
                "event": "start",
                "chat_color": self.chat_color,
            },
        )


async def handle_stop(self: AsyncWebsocketConsumer, consumer="chat"):
    if consumer == "voice":
        await delete_voice_chat_queue(self.user_id)
    else:
        await delete_chat_queue(self.user_id)

    await self.channel_layer.group_send(
        self.room_group_name,
        {
            "type": "chat.message",
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


async def handle_default(self: AsyncWebsocketConsumer, text_data_json, type):
    message = text_data_json.get("message")

    if type == "image":
        if self.image_consent:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message",
                    "message": message,
                    "user": self.username,
                    "event": "image",
                    "chat_color": self.chat_color,
                },
            )
        else:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message",
                    "message": "You don't have consent to send images",
                    "user": self.username,
                    "event": "no_consent",
                    "chat_color": self.chat_color,
                },
            )

    else:
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": message,
                "user": self.username,
                "event": "message",
                "chat_color": self.chat_color,
            },
        )


async def handle_image_consent(self: AsyncWebsocketConsumer, text_data_json, type):

    message = text_data_json.get("message")
    channel_name = text_data_json.get("channel_name")

    if message == "allow":
        await self.channel_layer.send(
            channel_name, {"type": "update.image_consent", "consent": True}
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": message,
                "user": self.username,
                "user_id": self.user_id,
                "event": "consent",
                "chat_color": self.chat_color,
            },
        )

    elif message == "disallow":
        await self.channel_layer.send(
            channel_name, {"type": "update.image_consent", "consent": False}
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": message,
                "user": self.username,
                "user_id": self.user_id,
                "event": "consent",
                "chat_color": self.chat_color,
            },
        )

async def cleanup_user_images(self):
    await asyncio.sleep(600)
    for img in os.listdir(settings.MEDIA_ROOT):
        if self.user_id in img:
            try:
                os.remove(f"{settings.MEDIA_ROOT}/{img}")
            except FileNotFoundError:
                pass