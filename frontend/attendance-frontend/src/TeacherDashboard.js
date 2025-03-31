// import React, { useState, useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { Bar } from 'react-chartjs-2';
// import { ref, onValue, push, set } from 'firebase/database';
// import { database } from './firebase';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const TeacherDashboard = () => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset
//   } = useForm();
  
//   const [activeQR, setActiveQR] = useState(null);
//   const [students, setStudents] = useState([]);
//   const [selectedCourse, setSelectedCourse] = useState(null);
//   const [courses, setCourses] = useState([]);
//   const [error, setError] = useState(null);
//   const [successMessage, setSuccessMessage] = useState(null);
//   const [attendanceData, setAttendanceData] = useState(null);

//   useEffect(() => {
//     // Fetch courses when component mounts
//     const teacherId = localStorage.getItem('userId');
//     if (teacherId) {
//       const query = ref(database, 'courses');
//       onValue(query, (snapshot) => {
//         const data = snapshot.val();
//         if (data) {
//           // Filter courses for this teacher
//           const teacherCourses = Object.entries(data)
//             .filter(([_, course]) => course.teacher_id === teacherId)
//             .map(([id, course]) => ({
//               id,
//               ...course
//             }));
//           setCourses(teacherCourses);
//         }
//       });

//       // Fetch students
//       const studentsRef = ref(database, 'users');
//       onValue(studentsRef, (snapshot) => {
//         const data = snapshot.val();
//         if (data) {
//           // Filter only student users
//           const studentsList = Object.entries(data)
//             .filter(([_, user]) => user.role === 'student')
//             .map(([id, user]) => ({
//               id,
//               ...user
//             }));
//           setStudents(studentsList);
//         }
//       });
//     }
//   }, []);

//   const onSubmit = async (data) => {
//     try {
//       const coursesRef = ref(database, 'courses');
//       const newCourseRef = push(coursesRef);
//       await set(newCourseRef, {
//         name: data.courseName,
//         teacher_id: localStorage.getItem('userId'),
//         created_at: new Date().toISOString()
//       });
//       setSuccessMessage('Course created successfully!');
//       setError(null);
//       reset(); // Reset form after successful submission
//     } catch (err) {
//       setError('Failed to create course');
//       console.error('Error creating course:', err);
//     }
//   };

//   const generateQR = async (courseId) => {
//     try {
//       const timestamp = new Date().toISOString();
//       const qrData = `${courseId}:${timestamp}`;
      
//       // Save QR data to Firebase
//       const qrRef = ref(database, `qrcodes/${courseId}`);
//       await set(qrRef, {
//         code: qrData,
//         timestamp: timestamp,
//         active: true
//       });

//       setActiveQR(qrData);
//       setSuccessMessage('QR code generated successfully');
//       setError(null);
//     } catch (err) {
//       setError('Failed to generate QR code');
//       console.error('Error generating QR:', err);
//     }
//   };

//   const fetchAttendanceStats = async (courseId) => {
//     try {
//       const attendanceRef = ref(database, 'attendance');
//       onValue(attendanceRef, (snapshot) => {
//         const data = snapshot.val();
//         if (data) {
//           // Filter attendance for this course
//           const courseAttendance = Object.values(data)
//             .filter(record => record.course_id === courseId);

//           // Group by date
//           const attendanceByDate = courseAttendance.reduce((acc, record) => {
//             const date = new Date(record.timestamp).toLocaleDateString();
//             acc[date] = (acc[date] || 0) + 1;
//             return acc;
//           }, {});

//           const chartData = {
//             labels: Object.keys(attendanceByDate),
//             datasets: [
//               {
//                 label: 'Attendance Count',
//                 data: Object.values(attendanceByDate),
//                 backgroundColor: 'rgba(75, 192, 192, 0.5)',
//                 borderColor: 'rgb(75, 192, 192)',
//                 borderWidth: 1,
//               },
//             ],
//           };

//           setAttendanceData(chartData);
//         }
//       });
//     } catch (err) {
//       console.error('Error fetching attendance data:', err);
//       setError('Failed to fetch attendance data');
//     }
//   };

//   const onCourseSelect = (courseId) => {
//     setSelectedCourse(courseId);
//     if (courseId) {
//       fetchAttendanceStats(courseId);
//     } else {
//       setAttendanceData(null);
//     }
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
      
//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//           {error}
//         </div>
//       )}
      
//       {successMessage && (
//         <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
//           {successMessage}
//         </div>
//       )}

//       <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
//         <div className="mb-4">
//           <label className="block text-gray-700 text-sm font-bold mb-2">
//             Course Name
//           </label>
//           <input
//             {...register('courseName', { required: 'Course name is required' })}
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//             type="text"
//             placeholder="Enter course name"
//           />
//           {errors.courseName && (
//             <p className="text-red-500 text-xs italic">{errors.courseName.message}</p>
//           )}
//         </div>
//         <button
//           type="submit"
//           className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//         >
//           Create Course
//         </button>
//       </form>

//       <div className="mb-6">
//         <h2 className="text-xl font-semibold mb-2">Select Course</h2>
//         <select
//           className="w-full p-2 border rounded"
//           onChange={(e) => onCourseSelect(e.target.value)}
//           value={selectedCourse || ''}
//         >
//           <option value="">Select a course</option>
//           {courses.map((course) => (
//             <option key={course.id} value={course.id}>
//               {course.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       {selectedCourse && (
//         <div className="mb-6">
//           <button
//             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//             onClick={() => generateQR(selectedCourse)}
//           >
//             Generate QR Code
//           </button>
//         </div>
//       )}

//       {activeQR && (
//         <div className="mb-6">
//           <h2 className="text-xl font-semibold mb-2">Active QR Code</h2>
//           <div className="p-4 border rounded">
//             <p className="font-mono">{activeQR}</p>
//           </div>
//         </div>
//       )}

//       {attendanceData && (
//         <div className="mb-6">
//           <h2 className="text-xl font-semibold mb-2">Attendance Statistics</h2>
//           <div className="h-64">
//             <Bar
//               data={attendanceData}
//               options={{
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 scales: {
//                   y: {
//                     beginAtZero: true,
//                     ticks: {
//                       stepSize: 1
//                     }
//                   }
//                 }
//               }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TeacherDashboard;
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
  const formMethods = useForm();
  const { register, handleSubmit, formState: { errors }, reset } = formMethods;
  
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
