from django.contrib import admin
from .models import User
from django.contrib.sessions.models import Session

admin.site.register(User)

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['session_key', 'get_decoded', 'expire_date']

    def get_decoded(self, obj):
        return obj.get_decoded()
