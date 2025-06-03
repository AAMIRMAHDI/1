from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import uuid
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'secret!')
socketio = SocketIO(app, cors_allowed_origins="*")

# ذخیره کاربران متصل
connected_users = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    user_id = str(uuid.uuid4())
    connected_users[user_id] = request.sid
    # اطلاع‌رسانی به سایر کاربران درباره کاربر جدید
    for other_user_id, sid in connected_users.items():
        if other_user_id != user_id:
            emit('message', {'type': 'new-user', 'userId': user_id}, room=sid)

@socketio.on('disconnect')
def handle_disconnect():
    user_id = None
    for uid, sid in connected_users.items():
        if sid == request.sid:
            user_id = uid
            break
    if user_id:
        del connected_users[user_id]

@socketio.on('message')
def handle_message(data):
    to_user = data.get('to')
    if to_user in connected_users:
        emit('message', {**data, 'userId': [uid for uid, sid in connected_users.items() if sid == request.sid][0]}, room=connected_users[to_user])