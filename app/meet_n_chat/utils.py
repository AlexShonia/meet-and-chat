import random

from app.meet_n_chat.models import ChatQueue, VoiceChatQueue
from channels.db import database_sync_to_async


@database_sync_to_async
def pop_chat_queue():
    queue = ChatQueue.objects.all()
    if queue.count() > 0:
        user_id = queue[0].user_id
        group_name = queue[0].group_name
        queue[0].delete()
        return (user_id, group_name)
    return None, None


@database_sync_to_async
def add_chat_queue(room_group_name, user_id):
    ChatQueue.objects.create(group_name=room_group_name, user_id=user_id)

@database_sync_to_async
def delete_chat_queue(user_id):
    ChatQueue.objects.filter(user_id=user_id).delete()

@database_sync_to_async
def pop_voice_chat_queue():
    queue = VoiceChatQueue.objects.all()
    if queue.count() > 0:
        user_id = queue[0].user_id
        group_name = queue[0].group_name
        queue[0].delete()
        return (user_id, group_name)
    return None, None


@database_sync_to_async
def add_voice_chat_queue(room_group_name, user_id):
    VoiceChatQueue.objects.create(group_name=room_group_name, user_id=user_id)

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
