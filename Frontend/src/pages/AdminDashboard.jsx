import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]); 

  const navigate = useNavigate();
  const adminUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!adminUser || adminUser.role !== 'admin') return navigate('/');
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      // 1. Fetch Users
      const uRes = await fetch('http://localhost:5000/api/admin/users');
      if (uRes.ok) {
        const allUsers = await uRes.json();
        if (Array.isArray(allUsers)) {
          setStudents(allUsers.filter(u => u.role === 'student'));
          setTeachers(allUsers.filter(u => u.role === 'teacher'));
        }
      }

      // 2. Fetch Courses
      const cRes = await fetch('http://localhost:5000/api/courses');
      if (cRes.ok) {
        const coursesData = await cRes.json();
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } else {
        setCourses([]); 
      }

    } catch (err) { 
      console.error("Error fetching admin data:", err); 
      setCourses([]); 
    }
  };

  const handleRemoveUser = async (id, name, role) => {
    if (!window.confirm(`Are you sure you want to remove ${name} (${role}) from the system?`)) return;
    try {
      await fetch(`http://localhost:5000/api/admin/users/${id}`, { method: 'DELETE' });
      fetchData(); 
    } catch (err) { alert("Failed to remove user."); }
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the course "${title}"?`)) return;
    try {
      await fetch(`http://localhost:5000/api/courses/${id}`, { method: 'DELETE' });
      fetchData(); 
    } catch (err) { alert("Failed to delete course."); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  return (
    <div className="dashboard-container">
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Portal</h2>
          <p>System Control</p>
        </div>
        <ul className="nav-links">
          <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>👥 Manage Users</li>
          <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>📚 Manage Courses</li>
        </ul>
        <div style={{ padding: '20px', marginTop: 'auto' }}>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleLogout}>Log Out</button>
        </div>
      </aside>

      <main className="main-content admin-layout">
        <div className="top-profile-bar">
          <div className="breadcrumb">Administration Control / {activeTab === 'users' ? 'User Management' : 'Course Management'}</div>
          <div className="profile-info">
            <div className="avatar admin-avatar">{adminUser?.name?.charAt(0) || 'A'}</div>
            <span>{adminUser?.name}</span>
          </div>
        </div>

        <div className="overview-header mb-4">
          <h1>Control Panel</h1>
          <h2>Monitor and manage platform data.</h2>
        </div>

        {activeTab === 'users' && (
          <div className="admin-users-split">
            <div className="section-card">
              <h3>Registered Students</h3>
              <div className="table-responsive mt-4">
                <table className="grading-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                  <tbody>
                    {students && students.length > 0 ? (
                      students.map((u, i) => {
                        if (!u) return null;
                        return (
                          <tr key={u.id || u._id || i}>
                            <td style={{ fontWeight: '600' }}>{u.name || 'Unknown'}</td>
                            <td>{u.email}</td>
                            <td>
                              <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '6px 12px' }} onClick={() => handleRemoveUser(u.id || u._id, u.name, 'student')}>
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No students found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section-card">
              <h3>Registered Teachers</h3>
              <div className="table-responsive mt-4">
                <table className="grading-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                  <tbody>
                    {teachers && teachers.length > 0 ? (
                      teachers.map((u, i) => {
                        if (!u) return null;
                        return (
                          <tr key={u.id || u._id || i}>
                            <td style={{ fontWeight: '600' }}>{u.name || 'Unknown'}</td>
                            <td>{u.email}</td>
                            <td>
                              <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '6px 12px' }} onClick={() => handleRemoveUser(u.id || u._id, u.name, 'teacher')}>
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No teachers found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="section-card">
            <h3>Active Course Modules</h3>
            <div className="table-responsive mt-4">
              <table className="grading-table">
                {/* FIX: Changed Header to "Teacher Name" */}
                <thead><tr><th>Course Title</th><th>Lectures Uploaded</th><th>Teacher Name</th><th>Action</th></tr></thead>
                <tbody>
                  {Array.isArray(courses) && courses.length > 0 ? (
                    courses.map((c, i) => {
                      if (!c) return null; 
                      
                      // FIX: Find the teacher in our list who matches this course's teacherId
                      const teacherObj = teachers.find(t => (t.id || t._id) === c.teacherId);
                      const teacherName = teacherObj ? teacherObj.name : 'Unknown Teacher';

                      return (
                        <tr key={c.id || c._id || i}>
                          <td style={{ fontWeight: '600' }}>{c.title || 'Untitled Course'}</td>
                          <td>{Array.isArray(c.lectures) ? c.lectures.length : 0} Videos</td>
                          
                          {/* FIX: Display the real name instead of the ID */}
                          <td>{teacherName}</td>
                          
                          <td>
                            <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '6px 12px' }} onClick={() => handleDeleteCourse(c.id || c._id, c.title)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No courses found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;