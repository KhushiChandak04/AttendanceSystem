import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeacherDashboard = () => {
  const [activeQR, setActiveQR] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents();
    }
  }, [selectedCourse]);

  const generateQRCode = async () => {
    try {
      const response = await axios.post('/api/generate-qr', {
        course_id: selectedCourse,
        teacher_id: localStorage.getItem('userId')
      });
      setActiveQR(response.data.qr_code);
      
      // Start monitoring attendance
      startAttendanceMonitoring();
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/course-attendance', {
        params: {
          course_id: selectedCourse
        }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const startAttendanceMonitoring = () => {
    // Set up WebSocket connection to get real-time updates
    const ws = new WebSocket('ws://localhost:5000/ws/attendance');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStudents(prevStudents => {
        return prevStudents.map(student => {
          if (student.id === data.student_id) {
            return { ...student, present: true };
          }
          return student;
        });
      });
    };
  };

  return (
    <div className="teacher-dashboard">
      <h1>Teacher Dashboard</h1>

      <div className="course-selector">
        <select 
          value={selectedCourse} 
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">Select Course</option>
          {/* Add course options dynamically */}
        </select>
      </div>

      {selectedCourse && (
        <div className="qr-section">
          <button onClick={generateQRCode}>
            Generate New QR Code
          </button>
          
          {activeQR && (
            <div className="qr-display">
              <img src={activeQR} alt="QR Code" />
              <p>QR Code will expire in 15 minutes</p>
            </div>
          )}
        </div>
      )}

      <div className="attendance-list">
        <h2>Live Attendance</h2>
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className={student.present ? 'present' : 'absent'}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.present ? 'Present' : 'Absent'}</td>
                <td>{student.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="attendance-summary">
        <h2>Attendance Summary</h2>
        <p>Total Students: {students.length}</p>
        <p>Present: {students.filter(s => s.present).length}</p>
        <p>Absent: {students.filter(s => !s.present).length}</p>
      </div>
    </div>
  );
};

export default TeacherDashboard;
