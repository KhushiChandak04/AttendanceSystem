import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Bar } from 'react-chartjs-2';
import { ref, onValue, push, set } from 'firebase/database';
import { database } from './firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TeacherDashboard = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  
  const [activeQR, setActiveQR] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);

  useEffect(() => {
    const teacherId = localStorage.getItem('userId');
    if (teacherId) {
      const query = ref(database, 'courses');
      onValue(query, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const teacherCourses = Object.entries(data)
            .filter(([_, course]) => course.teacher_id === teacherId)
            .map(([id, course]) => ({ id, ...course }));
          setCourses(teacherCourses);
        }
      });

      const studentsRef = ref(database, 'users');
      onValue(studentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const studentsList = Object.entries(data)
            .filter(([_, user]) => user.role === 'student')
            .map(([id, user]) => ({ id, ...user }));
          setStudents(studentsList);
        }
      });
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      const coursesRef = ref(database, 'courses');
      const newCourseRef = push(coursesRef);
      await set(newCourseRef, {
        name: data.courseName,
        teacher_id: localStorage.getItem('userId'),
        created_at: new Date().toISOString()
      });
      setSuccessMessage('Course created successfully!');
      setError(null);
      reset();
    } catch (err) {
      setError('Failed to create course');
      console.error('Error creating course:', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{successMessage}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Course Name</label>
          <input {...register('courseName', { required: 'Course name is required' })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder="Enter course name" />
          {errors.courseName && <p className="text-red-500 text-xs italic">{errors.courseName.message}</p>}
        </div>
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Create Course</button>
      </form>
    </div>
  );
};

export default TeacherDashboard;
