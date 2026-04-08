import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard'; 
import AdminDashboard from './pages/AdminDashboard'; // Import the new dashboard

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/teacher" element={<TeacherDashboard />} /> 
      <Route path="/admin" element={<AdminDashboard />} /> 
    </Routes>
  );
}

export default App;