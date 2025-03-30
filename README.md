# Presence+ Attendance Management System

A modern QR code-based attendance system with face recognition and GPS validation.

## Features

- QR Code Generation for each lecture
- Face Recognition verification
- GPS-based location validation
- Student Dashboard with attendance tracking
- Teacher Dashboard with real-time monitoring
- Attendance analytics and reporting

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize the database:
```bash
python app.py
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

## Usage

### For Teachers
1. Log in to the teacher dashboard
2. Select a course
3. Generate QR code for attendance
4. Monitor real-time attendance

### For Students
1. Log in to the student dashboard
2. Click "Scan QR Code" when in class
3. Allow camera access for face verification
4. Allow location access for GPS validation
5. View attendance statistics and notifications

## Security Features

- QR codes expire after 15 minutes
- Face recognition ensures physical presence
- GPS validation within 5-meter radius
- Encrypted data transmission
- Secure user authentication

## Technology Stack

- Backend: Flask
- Frontend: React
- Database: SQLite
- Face Recognition: face_recognition library
- QR Code: qrcode library
- Location: geopy
- Authentication: JWT
