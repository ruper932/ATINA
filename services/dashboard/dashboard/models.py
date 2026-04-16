from django.contrib.auth.models import User
from django.db import models
import pickle
import base64

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    face_encoding = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_face_encoding(self, encoding):
        self.face_encoding = base64.b64encode(pickle.dumps(encoding)).decode()
        self.save()

    def get_face_encoding(self):
        if self.face_encoding:
            return pickle.loads(base64.b64decode(self.face_encoding))
        return None