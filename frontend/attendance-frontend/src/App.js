import React from 'react';
import './App.css';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

function App() {
  // For testing, let's add a way to toggle between teacher and student views
  const [isTeacher, setIsTeacher] = React.useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Attendance Management System</h1>
        <button onClick={() => setIsTeacher(!isTeacher)}>
          Switch to {isTeacher ? 'Student' : 'Teacher'} View
        </button>
      </header>
      <main>
        {isTeacher ? <TeacherDashboard /> : <StudentDashboard />}
      </main>
    </div>
  );
}

export default App;
