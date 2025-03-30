import React, { useState, useEffect } from 'react';
import QrReader from 'react-qr-reader';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

const StudentDashboard = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
    checkAttendanceStatus();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const response = await axios.get('/api/attendance-stats', {
        params: {
          student_id: localStorage.getItem('userId'),
          course_id: localStorage.getItem('currentCourse')
        }
      });
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const handleQRScan = async (data) => {
    if (data) {
      try {
        // Get current location
        const position = await getCurrentPosition();
        
        // Get face image from webcam
        const faceImage = await captureFaceImage();

        // Send attendance data
        await axios.post('/api/mark-attendance', {
          qr_code: data,
          student_id: localStorage.getItem('userId'),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          face_image: faceImage,
        });

        setNotification('Attendance marked successfully!');
        setShowScanner(false);
        fetchAttendanceData();
      } catch (error) {
        setNotification(error.response?.data?.message || 'Error marking attendance');
      }
    }
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const captureFaceImage = async () => {
    // Implementation for capturing face image using webcam
    // This would use getUserMedia API and canvas to capture the image
  };

  const checkAttendanceStatus = () => {
    if (attendanceData && attendanceData.percentage < 75) {
      setNotification('Warning: Your attendance is below 75%');
    }
  };

  return (
    <div className="dashboard">
      <h1>Student Dashboard</h1>
      
      {notification && (
        <div className="notification">{notification}</div>
      )}

      <div className="attendance-stats">
        <h2>Attendance Overview</h2>
        <p>Total Classes: {attendanceData?.total_classes}</p>
        <p>Classes Attended: {attendanceData?.attended_classes}</p>
        <p>Attendance Percentage: {attendanceData?.percentage}%</p>
      </div>

      <button 
        className="scan-button"
        onClick={() => setShowScanner(true)}
      >
        Scan QR Code
      </button>

      {showScanner && (
        <div className="qr-scanner">
          <QrReader
            delay={300}
            onError={(err) => console.error(err)}
            onScan={handleQRScan}
            style={{ width: '100%' }}
          />
        </div>
      )}

      <div className="attendance-graph">
        <h2>Attendance Trend</h2>
        <Line
          data={{
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              label: 'Attendance %',
              data: [100, 80, 90, 85],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }]
          }}
        />
      </div>

      <div className="timetable">
        <h2>Today's Schedule</h2>
        {/* Implement timetable view */}
      </div>
    </div>
  );
};

export default StudentDashboard;
