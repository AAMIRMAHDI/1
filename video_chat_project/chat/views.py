from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('video_chat')
        else:
            messages.error(request, 'نام کاربری یا رمز عبور اشتباه است.')
    return render(request, 'login.html')

def video_chat_view(request):
    if not request.user.is_authenticated:
        return redirect('login')
    return render(request, 'video_chat.html')