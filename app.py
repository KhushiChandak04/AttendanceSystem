from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
from datetime import datetime, timedelta
import qrcode
import face_recognition
import numpy as np
from geopy.distance import geodesic
import os
import cv2
import bcrypt

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///attendance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key'  # Change this in production

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'student' or 'teacher'
    face_encoding = db.Column(db.PickleType, nullable=True)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'))

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    timestamp = db.Column(db.DateTime, nullable=False)
    qr_code = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)

# QR Code generation
def generate_qr_code(course_id, timestamp):
    data = f"{course_id}:{timestamp}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white")

# Routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user.password):
        access_token = create_access_token(identity=user.id)
        return jsonify({'token': access_token, 'role': user.role}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/generate-qr', methods=['POST'])
def generate_qr():
    data = request.get_json()
    course_id = data['course_id']
    qr_code = generate_qr_code(course_id, datetime.utcnow())
    # Save QR code and return path
    return jsonify({'qr_code': 'path_to_qr_code'})

@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    data = request.get_json()
    
    # Verify QR Code
    qr_data = data['qr_code']
    course_id, timestamp = qr_data.split(':')
    qr_time = datetime.fromisoformat(timestamp)
    if datetime.utcnow() - qr_time > timedelta(minutes=15):
        return jsonify({'message': 'QR Code expired'}), 400

    # Verify Location
    student_location = (data['latitude'], data['longitude'])
    class_location = (data['class_latitude'], data['class_longitude'])
    if geodesic(student_location, class_location).meters > 5:
        return jsonify({'message': 'Not in class vicinity'}), 400

    # Verify Face
    student = User.query.get(data['student_id'])
    face_image = face_recognition.load_image_file(data['face_image'])
    face_encoding = face_recognition.face_encodings(face_image)[0]
    if not face_recognition.compare_faces([student.face_encoding], face_encoding)[0]:
        return jsonify({'message': 'Face verification failed'}), 400

    # Mark attendance
    attendance = Attendance(
        student_id=data['student_id'],
        course_id=course_id,
        timestamp=datetime.utcnow(),
        qr_code=data['qr_code'],
        location=f"{student_location[0]},{student_location[1]}"
    )
    db.session.add(attendance)
    db.session.commit()

    return jsonify({'message': 'Attendance marked successfully'}), 200

@app.route('/api/attendance-stats', methods=['GET'])
def attendance_stats():
    student_id = request.args.get('student_id')
    course_id = request.args.get('course_id')
    
    # Calculate attendance statistics
    total_classes = Course.query.get(course_id).classes.count()
    attended_classes = Attendance.query.filter_by(
        student_id=student_id, 
        course_id=course_id
    ).count()
    
    percentage = (attended_classes / total_classes) * 100 if total_classes > 0 else 0
    
    return jsonify({
        'total_classes': total_classes,
        'attended_classes': attended_classes,
        'percentage': percentage
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
