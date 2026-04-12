from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.http import JsonResponse
from .models import UserProfile
import face_recognition
import cv2
import numpy as np
import base64

@login_required
def register_face(request):
    if request.method == 'POST':
        image_data = request.POST.get('image_data')
        if image_data:
            image_bytes = base64.b64decode(image_data.split(',')[1])
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            encodings = face_recognition.face_encodings(rgb_image)

            if encodings:
                profile, created = UserProfile.objects.get_or_create(user=request.user)
                profile.set_face_encoding(encodings[0])
                return JsonResponse({'success': True, 'message': 'Rostro registrado correctamente'})

            return JsonResponse({'success': False, 'message': 'No se detectó ningún rostro'})

    return render(request, 'register_face.html')


def face_login(request):
    if request.method == 'POST':
        image_data = request.POST.get('image_data')
        if image_data:
            image_bytes = base64.b64decode(image_data.split(',')[1])
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            encodings = face_recognition.face_encodings(rgb_image)

            if encodings:
                unknown_encoding = encodings[0]

                for profile in UserProfile.objects.exclude(face_encoding__isnull=True):
                    known_encoding = profile.get_face_encoding()
                    if known_encoding is not None:
                        matches = face_recognition.compare_faces(
                            [known_encoding],
                            unknown_encoding,
                            tolerance=0.5
                        )

                        if matches[0]:
                            login(request, profile.user)
                            return JsonResponse({
                                'success': True,
                                'message': f'Bienvenido {profile.user.username}'
                            })

                return JsonResponse({'success': False, 'message': 'Rostro no reconocido'})

            return JsonResponse({'success': False, 'message': 'No se detectó ningún rostro'})

    return render(request, 'face_login.html')