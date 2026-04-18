from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.http import JsonResponse
from .models import UserProfile
import face_recognition
import cv2
import numpy as np
import base64
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.models import User
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages

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


def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('/')
        else:
            messages.error(request, 'Usuario o contraseña incorrectos')

    return render(request, 'login.html')

@login_required
def user_logout(request):
    logout(request)
    return redirect('/accounts/login/')


@staff_member_required(login_url='/biometric/login/')
def user_list(request):
    users = User.objects.all().order_by('-date_joined')
    return render(request, 'dashboard/user_list.html', {'users': users})

@staff_member_required(login_url='/biometric/login/')
def user_create(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '').strip()
        is_staff = True if request.POST.get('is_staff') == 'on' else False

        if not username or not password:
            messages.error(request, 'Usuario y contraseña son obligatorios.')
            return redirect('user_create')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Ese nombre de usuario ya existe.')
            return redirect('user_create')

        User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=is_staff
        )

        messages.success(request, 'Usuario creado correctamente.')
        return redirect('user_list')

    return render(request, 'dashboard/user_create.html')

@staff_member_required(login_url='/biometric/login/')
def user_delete(request, user_id):
    user_obj = get_object_or_404(User, id=user_id)

    if request.method == 'POST':
        if request.user.id == user_obj.id:
            messages.error(request, 'No puedes eliminar tu propio usuario.')
        else:
            user_obj.delete()
            messages.success(request, 'Usuario eliminado correctamente.')
        return redirect('user_list')

    return render(request, 'dashboard/user_delete.html', {'user_obj': user_obj})