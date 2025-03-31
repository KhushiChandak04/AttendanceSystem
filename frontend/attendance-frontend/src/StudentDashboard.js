import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Line } from 'react-chartjs-2';
import { ref, onValue, push, set, get } from 'firebase/database';
import { database } from './firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StudentDashboard = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [notification, setNotification] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(onScanSuccess, onScanError);

    // Fetch courses
    const coursesRef = ref(database, 'courses');
    onValue(coursesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const coursesList = Object.entries(data).map(([id, course]) => ({
          id,
          ...course
        }));
        setCourses(coursesList);
      }
    });

    // Fetch student's attendance
    const studentId = localStorage.getItem('userId');
    if (studentId) {
      fetchAttendanceData(studentId);
    }

    // Cleanup
    return () => {
      scanner.clear().catch(error => {
        console.error('Failed to clear scanner', error);
      });
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    try {
      const [courseId, timestamp] = decodedText.split(':');
      const studentId = localStorage.getItem('userId');
      
      // Check if QR code is still valid
      const qrRef = ref(database, `qrcodes/${courseId}`);
      const qrSnapshot = await get(qrRef);
      const qrData = qrSnapshot.val();
      
      if (!qrData || !qrData.active || qrData.code !== decodedText) {
        setError('Invalid or expired QR code');
        return;
      }

      // Check if student is already marked for this course today
      const today = new Date().toISOString().split('T')[0];
      const attendanceRef = ref(database, 'attendance');
      const attendanceSnapshot = await get(attendanceRef);
      const attendanceData = attendanceSnapshot.val();
      
      if (attendanceData) {
        const alreadyMarked = Object.values(attendanceData).some(record => 
          record.student_id === studentId &&
          record.course_id === courseId &&
          record.timestamp.startsWith(today)
        );

        if (alreadyMarked) {
          setError('Attendance already marked for today');
          return;
        }
      }

      // Record attendance
      const newAttendanceRef = push(attendanceRef);
      await set(newAttendanceRef, {
        student_id: studentId,
        course_id: courseId,
        timestamp: new Date().toISOString()
      });

      setNotification('Attendance recorded successfully!');
      setScanResult(decodedText);
      
      // Refresh attendance data
      fetchAttendanceData(studentId);
    } catch (err) {
      setError('Failed to record attendance');
      console.error('Error recording attendance:', err);
    }
  };

  const onScanError = (err) => {
    console.warn(err);
  };

  const fetchAttendanceData = async (studentId) => {
    try {
      const attendanceRef = ref(database, 'attendance');
      onValue(attendanceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Filter attendance for this student
          const studentAttendance = Object.values(data)
            .filter(record => record.student_id === studentId);

          // Group by course and date
          const attendanceByDate = studentAttendance.reduce((acc, record) => {
            const date = new Date(record.timestamp).toLocaleDateString();
            const course = courses.find(c => c.id === record.course_id)?.name || 'Unknown Course';
            acc[course] = acc[course] || {};
            acc[course][date] = (acc[course][date] || 0) + 1;
            return acc;
          }, {});

          // Create datasets for each course
          const datasets = Object.entries(attendanceByDate).map(([course, dates], index) => ({
            label: course,
            data: Object.values(dates),
            fill: false,
            borderColor: `hsl(${index * 137.5}, 70%, 50%)`,
            tension: 0.1,
          }));

          // Get all unique dates
          const allDates = [...new Set(
            Object.values(attendanceByDate)
              .flatMap(dates => Object.keys(dates))
          )].sort();

          const chartData = {
            labels: allDates,
            datasets: datasets,
          };

          setAttendanceData(chartData);
        }
      });
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to fetch attendance data');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {notification && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {notification}
        </div>
      )}

      <div className="mb-6">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setShowScanner(!showScanner)}
        >
          {showScanner ? 'Hide Scanner' : 'Show Scanner'}
        </button>
      </div>

      {showScanner && (
        <div className="mb-6">
          <div id="reader"></div>
        </div>
      )}

      {scanResult && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Last Scan Result</h2>
          <div className="p-4 border rounded">
            <p className="font-mono">{scanResult}</p>
          </div>
        </div>
      )}

      {attendanceData && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Attendance History</h2>
          <div className="h-64">
            <Line
              data={attendanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
