from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
from datetime import datetime, timedelta
import qrcode
# import face_recognition  # Temporarily commented out
import numpy as np
from geopy.distance import geodesic
import os
import cv2
import bcrypt
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, db

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
cred = credentials.Certificate('config/serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://attendance-23d5a-default-rtdb.firebaseio.com'
})

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', '763c43f173da75a364b2dd9fff673e6a4728acf77c6037304772a6bd37f30079')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', '4ddccb335a80fe7b35896386708cb7c84bb6acab98c801ca645a8c3c939db44e')

# Initialize JWT
jwt = JWTManager(app)

# Firebase references
users_ref = db.reference('users')
courses_ref = db.reference('courses')
attendance_ref = db.reference('attendance')

@app.route('/')
def index():
    return "Attendance System API"

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Get user from Firebase
    users_snapshot = users_ref.order_by_child('username').equal_to(username).get()
    
    if not users_snapshot:
        return jsonify({"error": "User not found"}), 404
    
    user_id, user_data = list(users_snapshot.items())[0]
    
    if bcrypt.checkpw(password.encode('utf-8'), user_data['password'].encode('utf-8')):
        access_token = create_access_token(identity=user_id)
        return jsonify({
            "token": access_token,
            "role": user_data['role']
        })
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/generate-qr', methods=['POST'])
def generate_qr():
    data = request.json
    course_id = data.get('course_id')
    
    # Verify course exists in Firebase
    course = courses_ref.child(course_id).get()
    if not course:
        return jsonify({"error": "Course not found"}), 404

    timestamp = datetime.now().isoformat()
    qr_data = f"{course_id}:{timestamp}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_image = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR code (you might want to save this to Firebase Storage instead)
    qr_path = f"qrcodes/{course_id}_{timestamp}.png"
    qr_image.save(qr_path)
    
    return jsonify({
        "qr_code": qr_data,
        "timestamp": timestamp
    })

@app.route('/mark-attendance', methods=['POST'])
def mark_attendance():
    data = request.json
    student_id = data.get('student_id')
    qr_data = data.get('qr_code')
    location = data.get('location')
    # face_image = data.get('face_image')  # Base64 encoded image

    # Verify QR code
    try:
        course_id, timestamp = qr_data.split(':')
        qr_timestamp = datetime.fromisoformat(timestamp)
        
        # Check if QR code is expired (15 minutes)
        if datetime.now() - qr_timestamp > timedelta(minutes=15):
            return jsonify({"error": "QR code expired"}), 400
    except:
        return jsonify({"error": "Invalid QR code"}), 400

    # Verify student is enrolled in course
    course = courses_ref.child(course_id).get()
    if not course or student_id not in course.get('students', []):
        return jsonify({"error": "Student not enrolled in course"}), 403

    # Get teacher's location from course data
    teacher_location = course.get('location', '').split(',')
    student_location = location.split(',')
    
    # Check if student is within 5 meters of teacher
    if len(teacher_location) == 2 and len(student_location) == 2:
        distance = geodesic(
            (float(teacher_location[0]), float(teacher_location[1])),
            (float(student_location[0]), float(student_location[1]))
        ).meters
        
        if distance > 5:
            return jsonify({"error": "You are too far from the class location"}), 400

    # Record attendance in Firebase
    new_attendance = {
        'student_id': student_id,
        'course_id': course_id,
        'timestamp': datetime.now().isoformat(),
        'location': location
    }
    
    attendance_ref.push(new_attendance)
    
    return jsonify({"message": "Attendance marked successfully"})

@app.route('/attendance-stats', methods=['GET'])
def attendance_stats():
    course_id = request.args.get('course_id')
    
    # Get course data
    course = courses_ref.child(course_id).get()
    if not course:
        return jsonify({"error": "Course not found"}), 404

    # Get attendance records for the course
    attendance_records = attendance_ref.order_by_child('course_id').equal_to(course_id).get()
    
    if not attendance_records:
        return jsonify({
            "total_classes": 0,
            "attendance_by_student": {},
            "attendance_by_date": {}
        })

    # Process attendance records
    attendance_by_student = {}
    attendance_by_date = {}
    
    for record in attendance_records.values():
        student_id = record['student_id']
        date = datetime.fromisoformat(record['timestamp']).date().isoformat()
        
        # Count by student
        if student_id not in attendance_by_student:
            attendance_by_student[student_id] = 0
        attendance_by_student[student_id] += 1
        
        # Count by date
        if date not in attendance_by_date:
            attendance_by_date[date] = 0
        attendance_by_date[date] += 1

    return jsonify({
        "total_classes": len(attendance_by_date),
        "attendance_by_student": attendance_by_student,
        "attendance_by_date": attendance_by_date
    })

if __name__ == '__main__':
    app.run(debug=True)
