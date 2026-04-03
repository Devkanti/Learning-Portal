import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('manage'); 
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [deadline, setDeadline] = useState(''); 
  const [video, setVideo] = useState(null);
  const [poster, setPoster] = useState(null);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [status, setStatus] = useState('');
  
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]); 
  
  const [managingCourse, setManagingCourse] = useState(null);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureVideo, setNewLectureVideo] = useState(null);
  const [newLectureAssessment, setNewLectureAssessment] = useState(null); 
  const [newLectureDeadline, setNewLectureDeadline] = useState(''); 
  const [lectureStatus, setLectureStatus] = useState('');

  const [evaluatingId, setEvaluatingId] = useState(null);
  const [evalGrade, setEvalGrade] = useState('');
  const [evalFeedback, setEvalFeedback] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [profileName, setProfileName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [age, setAge] = useState(user?.age || '');

  useEffect(() => {
    if (!user || user.role !== 'teacher') return navigate('/');
    fetchCourses(); 
    fetchSubmissions();
    fetchStudents(); 
  }, [navigate, user?.id]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/courses');
      const data = await res.json();
      setCourses(data.filter(c => c.teacherId === user.id));
    } catch (err) {}
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/courses/teacher/${user.id}/submissions`);
      setSubmissions(await res.json());
    } catch (err) {}
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users');
      if (res.ok) {
        const allUsers = await res.json();
        setRegisteredStudents(allUsers.filter(u => u.role === 'student'));
      }
    } catch (err) {}
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault(); setStatus('Publishing course...');
    const formData = new FormData();
    formData.append('title', title); formData.append('description', description);
    formData.append('teacherId', user.id); formData.append('videoTitle', videoTitle);
    formData.append('deadline', deadline); 
    if (poster) formData.append('poster', poster);
    if (video) formData.append('video', video);
    if (assignmentFile) formData.append('assessment', assignmentFile); 

    try {
      const response = await fetch('http://localhost:5000/api/courses', { method: 'POST', body: formData });
      if (response.ok) {
        setStatus('Course created successfully! ✅'); setTitle(''); setDescription(''); setVideoTitle(''); setDeadline(''); setVideo(null); setPoster(null); setAssignmentFile(null);
        fetchCourses(); setActiveTab('manage');
      } else setStatus('Failed to create course.');
    } catch (error) { setStatus('Error connecting to server.'); }
  };

  const handleAddLecture = async (e) => {
    e.preventDefault(); setLectureStatus('Uploading video...');
    const formData = new FormData();
    formData.append('title', newLectureTitle); formData.append('deadline', newLectureDeadline); 
    if(newLectureVideo) formData.append('video', newLectureVideo);
    if(newLectureAssessment) formData.append('assessment', newLectureAssessment); 

    try {
      const response = await fetch(`http://localhost:5000/api/courses/${managingCourse.id || managingCourse._id}/lectures`, { method: 'POST', body: formData });
      if (response.ok) {
        setLectureStatus('Video added successfully! ✅'); setNewLectureTitle(''); setNewLectureVideo(null); setNewLectureAssessment(null); setNewLectureDeadline('');
        fetchCourses();
        const updatedRes = await fetch('http://localhost:5000/api/courses');
        const updatedData = await updatedRes.json();
        setManagingCourse(updatedData.find(c => (c.id || c._id) === (managingCourse.id || managingCourse._id)));
      } else setLectureStatus('Failed to upload.');
    } catch (error) { setLectureStatus('Error connecting to server.'); }
  };

  const handleDeleteLecture = async (courseId, lectureId) => {
    if (!window.confirm("Are you sure you want to delete this specific video lecture?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/lectures/${lectureId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert("Lecture deleted successfully!");
        fetchCourses();
        const updatedRes = await fetch('http://localhost:5000/api/courses');
        const updatedData = await updatedRes.json();
        setManagingCourse(updatedData.find(c => (c.id || c._id) === courseId));
      } else {
        alert("Failed to delete lecture.");
      }
    } catch (error) {
      alert("Error connecting to server.");
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to completely delete "${courseTitle}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert("Course deleted successfully!");
        fetchCourses(); 
      } else {
        alert("Failed to delete course.");
      }
    } catch (error) {
      alert("Error connecting to server.");
    }
  };

  // --- FIX: Passing the full submission object to the new Unified Route ---
  const submitGrade = async (sub, isMissingFile) => {
    if (!evalGrade) return alert("Please enter a numeric grade.");
    
    const numericGrade = parseInt(evalGrade, 10);
    const maxAllowed = isMissingFile ? 90 : 100; 
    
    if (numericGrade < 0 || numericGrade > maxAllowed) {
      return alert(`Error: The score must be between 0 and ${maxAllowed} for this assignment.`);
    }

    try {
      // Changed from PUT to POST to hit the new route
      const response = await fetch(`http://localhost:5000/api/courses/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          submissionId: sub.id,
          studentId: sub.User.id,   // Passed from the Ghost object
          courseId: sub.Course.id,  // Passed from the Ghost object
          lectureId: sub.Lecture.id,// Passed from the Ghost object
          grade: numericGrade, 
          feedback: evalFeedback 
        })
      });
      
      if (response.ok) {
        setEvaluatingId(null); 
        setEvalGrade(''); 
        setEvalFeedback(''); 
        fetchSubmissions(); // Refresh the list!
      } else {
        alert('Failed to save grade.');
      }
    } catch (error) {
      alert("Error connecting to server.");
    }
  };

  const handleDobChange = (e) => {
    const selectedDate = e.target.value;
    setDob(selectedDate);
    if (selectedDate) {
      const today = new Date(); const birthDate = new Date(selectedDate);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { calculatedAge--; }
      setAge(calculatedAge);
    } else { setAge(''); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone, dob, age })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user)); 
        alert("Profile updated successfully! ✅");
        window.location.reload(); 
      } else { alert(data.message || "Failed to update profile."); }
    } catch (err) { alert("Error connecting to the server."); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  return (
    <div className="dashboard-container">
      <aside className="sidebar light-sidebar">
        <div className="sidebar-header">
          <h2>Teacher Portal</h2>
          <p>Educator Panel</p>
        </div>
        <ul className="nav-links">
          <li className={activeTab === 'manage' ? 'active' : ''} onClick={() => {setActiveTab('manage'); setManagingCourse(null);}}>📚 Manage Modules</li>
          <li className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>➕ Create Course</li>
          <li className={activeTab === 'progress' ? 'active' : ''} onClick={() => {setActiveTab('progress'); setManagingCourse(null);}}>📈 Student Progress</li>
          <li className={activeTab === 'submissions' ? 'active' : ''} onClick={() => setActiveTab('submissions')}>📝 Grading Desk</li>
        </ul>
        <div style={{ padding: '20px', marginTop: 'auto' }}>
          <button className="btn btn-outline w-full" onClick={handleLogout}>Log Out</button>
        </div>
      </aside>

      <main className="main-content teacher-layout">
        <div className="top-profile-bar">
          <div className="breadcrumb">Teacher Portal</div>
          <div className="profile-info" onClick={() => { setActiveTab('profile'); setManagingCourse(null); }} style={{ cursor: 'pointer' }} title="Profile Settings">
            <div className="avatar">{user?.name.charAt(0)}</div>
            <span>Prof. {user?.name}</span>
          </div>
        </div>

        {activeTab === 'profile' && (
          <div className="section-card profile-settings-card">
            <h2><span>👤</span> Profile Settings</h2>
            <form className="create-course-form" onSubmit={handleSaveProfile}>
              <div className="form-group"><label>Full Name</label><input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required /></div>
              <div className="grid-cols-2"><div className="form-group"><label>Date of Birth</label><input type="date" value={dob} onChange={handleDobChange} /></div><div className="form-group"><label>Age</label><input type="number" value={age} readOnly placeholder="--" style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} title="Age is calculated automatically" /></div></div>
              <div className="form-group"><label>Email Address</label><input type="email" defaultValue={user?.email} readOnly style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} /></div>
              <div className="form-group"><label>Phone Number</label><input type="tel" placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <button type="submit" className="btn mt-4 w-full">Save Changes</button>
            </form>
          </div>
        )}

        {activeTab === 'manage' && !managingCourse && (
          <div>
            <div className="overview-header mb-4"><h1>My Course Modules</h1><h2>Select a course to add lectures or grade.</h2></div>
            <div className="course-grid">
              {courses.map(course => (
                <div key={course.id || course._id} className="course-card" onClick={() => setManagingCourse(course)}>
                  <div className={`card-image-header ${course.posterUrl ? '' : 'card-image-header-fallback'}`} style={{ backgroundImage: course.posterUrl ? `url("http://localhost:5000/${course.posterUrl.replace(/\\/g, '/')}")` : '' }}></div>
                  <div className="card-body">
                    <h4 className="card-title">{course.title}</h4>
                    <div className="card-meta">
                      <span className="card-score">🎬 {course.lectures?.length || 0} Video Lectures</span>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id || course._id, course.title); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold' }} title="Delete Course">Delete</button>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Manage →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'manage' && managingCourse && (
          <div>
            <button className="btn btn-outline mb-4" onClick={() => setManagingCourse(null)}>← Back to Modules</button>
            <div className="overview-header mb-4"><h1>Managing: {managingCourse.title}</h1></div>
            <div className="section-card">
              <h3>Upload a New Video Lecture</h3>
              <form onSubmit={handleAddLecture}>
                <div className="form-group"><label>Lecture Title</label><input type="text" value={newLectureTitle} onChange={(e) => setNewLectureTitle(e.target.value)} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                  <div className="form-group"><label>Video File</label><input type="file" accept="video/*" onChange={(e) => setNewLectureVideo(e.target.files[0])} required /></div>
                  <div className="form-group"><label>Deadline</label><input type="date" value={newLectureDeadline} onChange={(e) => setNewLectureDeadline(e.target.value)} /></div>
                </div>
                <div className="form-group" style={{ backgroundColor: 'var(--primary-light)', padding: '15px', borderRadius: '4px', borderLeft: '4px solid var(--primary)'}}><label style={{ color: 'var(--primary-hover)' }}>Assignment Worksheet (PDF/DOCX - Optional)</label><input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setNewLectureAssessment(e.target.files[0])} /></div>
                <button type="submit" className="btn mt-2">Upload & Add Video</button>
                {lectureStatus && <span style={{ marginLeft: '16px', fontWeight: 'bold', color: 'var(--success)' }}>{lectureStatus}</span>}
              </form>
            </div>
            
            <div className="section-card">
              <h3>Existing Video Lectures</h3>
              {managingCourse.lectures.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No lectures uploaded yet.</p>
              ) : (
                managingCourse.lectures.map((lec, i) => (
                  <div key={lec._id || lec.id || i} className="student-lecture-item" style={{ border: 'none', borderBottom: '1px solid #f1f5f9'}}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px'}}>
                          <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold'}}>{i + 1}</span>
                          <span style={{ fontWeight: '500'}}>{lec.title}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div>
                              {lec.assignmentPrompt && <span className="badge-pending">Has Assessment</span>}
                              {lec.assignmentDeadline && <span className="badge-deadline" style={{ marginLeft: '10px'}}>Due: {new Date(lec.assignmentDeadline).toLocaleDateString()}</span>}
                          </div>
                          
                          <button 
                            className="btn btn-outline" 
                            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '4px 10px', fontSize: '0.8rem' }}
                            onClick={() => handleDeleteLecture(managingCourse.id || managingCourse._id, lec.id || lec._id)}
                          >
                            Delete
                          </button>
                      </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
           <div className="section-card">
           <h3>Create a New Subject Module</h3>
           <form onSubmit={handleCreateCourse} className="mt-4">
             <div className="form-group"><label>Course Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
             <div className="form-group"><label>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="3"></textarea></div>
             <div className="form-group"><label>Course Poster Image</label><input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => setPoster(e.target.files[0])} /></div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0'}}><div className="form-group"><label>First Video Title</label><input type="text" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} /></div><div className="form-group"><label>First Video File</label><input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0])} /></div></div>
             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', backgroundColor: 'var(--primary-light)', padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--primary)', marginBottom: '24px'}}><div className="form-group"><label style={{ color: 'var(--primary-hover)' }}>Attach Assessment Worksheet (Word or PDF)</label><input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setAssignmentFile(e.target.files[0])} /></div><div className="form-group"><label style={{ color: 'var(--primary-hover)' }}>Submission Deadline</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div></div>
             <button type="submit" className="btn">Publish Full Course</button>
             {status && <span style={{ marginLeft: '16px', fontWeight: 'bold', color: 'var(--success)' }}>{status}</span>}
           </form>
         </div>
        )}

        {activeTab === 'progress' && (
          <div className="section-card">
            <h3>Registered Student Progress</h3>
            <p className="course-desc mb-4">Monitor how many videos students have marked as completed.</p>
            <div className="table-responsive mt-4">
              <table className="grading-table">
                <thead><tr><th>Student Name</th><th>Email</th><th>Videos Completed</th></tr></thead>
                <tbody>
                  {registeredStudents.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px' }}>No students found.</td></tr>
                  ) : (
                    registeredStudents.map(student => (
                      <tr key={student.id || student._id}>
                        <td style={{ fontWeight: '600' }}>{student.name}</td>
                        <td>{student.email}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                          {student.completedVideos ? student.completedVideos.length : 0} Videos
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
           <div className="section-card">
             <h3>Grading Desk</h3>
             <div className="table-responsive mt-4">
               <table className="grading-table">
                 <thead><tr><th>Student Name</th><th>Course Title</th><th>File</th><th>Grade / Feedback</th></tr></thead>
                 <tbody>
                   {submissions.length === 0 ? (<tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No assignments exist for your courses yet.</td></tr>) : (
                     submissions.map((sub) => {
                       const isMissingFile = !sub.fileUrl; 
                       const maxScore = isMissingFile ? 90 : 100; 

                       return (
                         <tr key={sub.id}>
                           <td style={{ fontWeight: '600' }}>{sub.User?.name || 'Unknown Student'}</td>
                           <td style={{ fontWeight: '500' }}>{sub.Course?.title || 'Unknown Course'}</td>
                           
                           <td>
                             {isMissingFile ? (
                               <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Not Submitted</span>
                             ) : (
                               <a href={`http://localhost:5000/${sub.fileUrl.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer">📄 View Work</a>
                             )}
                           </td>
                           
                           <td style={{ minWidth: '250px' }}>
                             {sub.grade !== null ? (
                               <div>
                                 <span className="badge-success">Score: {sub.grade}</span>
                                 {sub.feedback && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>"{sub.feedback}"</div>}
                               </div>
                             ) : evaluatingId === sub.id ? (
                               <div className="eval-form-box">
                                 <input 
                                   type="number" 
                                   min="0"
                                   max={maxScore}
                                   placeholder={`Score (0-${maxScore})`} 
                                   style={{ padding: '8px', border: '1px solid var(--border-light)', borderRadius: '4px', width: '100%', marginBottom: '4px' }} 
                                   value={evalGrade} 
                                   onChange={(e) => setEvalGrade(e.target.value)} 
                                 />
                                 <input 
                                   type="text" 
                                   placeholder="Feedback (optional)" 
                                   style={{ padding: '8px', border: '1px solid var(--border-light)', borderRadius: '4px', width: '100%', marginBottom: '8px' }} 
                                   value={evalFeedback} 
                                   onChange={(e) => setEvalFeedback(e.target.value)} 
                                 />
                                 <div style={{ display: 'flex', gap: '8px' }}>
                                   {/* FIX: Passing the entire 'sub' object and 'isMissingFile' */}
                                   <button className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => submitGrade(sub, isMissingFile)}>Save</button>
                                   <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => { setEvaluatingId(null); setEvalGrade(''); setEvalFeedback(''); }}>Cancel</button>
                                 </div>
                               </div>
                             ) : (
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                 <span className="badge-pending">Pending Review</span>
                                 <button 
                                   className="btn btn-outline" 
                                   style={{ padding: '6px 12px'}} 
                                   onClick={() => { setEvaluatingId(sub.id); setEvalGrade(''); setEvalFeedback(''); }}
                                 >
                                   Evaluate
                                 </button>
                               </div>
                             )}
                           </td>
                         </tr>
                       );
                     })
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

export default TeacherDashboard;