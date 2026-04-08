import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null); 
  
  const [submittingLectureId, setSubmittingLectureId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const [myGrades, setMyGrades] = useState([]);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [profileName, setProfileName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [age, setAge] = useState(user?.age || '');

  // --- FIX: Use the permanent database array instead of temporary state ---
  const [completedVideos, setCompletedVideos] = useState(user?.completedVideos || []);

  useEffect(() => {
    if (!user || user.role !== 'student') return navigate('/');
    fetch('http://localhost:5000/api/courses').then(res => res.json()).then(data => setCourses(data));
    fetch(`http://localhost:5000/api/courses/student/${user.id}/submissions`).then(res => res.json()).then(data => setMyGrades(data));
  }, [navigate, user?.id]);

  const checkSubmission = (courseTitle, lectureTitle) => {
    return myGrades.some(grade => grade.Course.title === courseTitle && grade.Lecture.title === lectureTitle);
  };

  const getDaysRemainingText = (dateString) => {
    if (!dateString) return "No Deadline";
    const due = new Date(dateString);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return `${diffDays} days remaining`;
    if (diffDays === 1) return `1 day remaining`;
    if (diffDays === 0) return `Due Today`;
    return `Overdue`;
  };

  const checkIsOverdue = (dateString) => {
    if (!dateString) return false;
    const due = new Date(dateString);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return (due - today) < 0; 
  };

  // --- FIX: Database-connected Progress Toggle ---
  const toggleMarkDone = async (lectureId) => {
    // Update UI instantly
    const isCurrentlyDone = completedVideos.includes(lectureId);
    const updatedList = isCurrentlyDone
        ? completedVideos.filter(id => id !== lectureId)
        : [...completedVideos, lectureId];

    setCompletedVideos(updatedList);

    // Update local storage so a page refresh doesn't break it
    const updatedUser = { ...user, completedVideos: updatedList };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Send it to the backend to save permanently
    try {
        await fetch(`http://localhost:5000/api/auth/progress/${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lectureId })
        });
    } catch (err) {
        console.error("Failed to save progress to database", err);
    }
  };

  // --- FIX: Simplified calculation based on the flat database array ---
  const calculateProgress = () => {
    if(!activeCourse || !activeCourse.lectures) return 0;
    const totalLectures = activeCourse.lectures.length;
    if(totalLectures === 0) return 0;

    const doneCount = activeCourse.lectures.filter(lec => completedVideos.includes(lec._id || lec.id)).length;
    return Math.round((doneCount / totalLectures) * 100);
  };

  const handleFileUpload = async (e, currentLectureId) => {
    e.preventDefault();
    const fileInput = e.target.querySelector('input[type="file"]');
    const file = fileInput?.files[0];
    if (!file) return alert("Please select a file to upload.");
    if (!currentLectureId) return alert("System Error: Lecture ID is missing.");

    setSubmittingLectureId(currentLectureId);
    setUploadStatus('Sending assignment...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', user.id);
    formData.append('lectureId', currentLectureId); 

    try {
      const response = await fetch(`http://localhost:5000/api/courses/${activeCourse.id}/submit`, { method: 'POST', body: formData });
      if (response.ok) { 
        setUploadStatus('Assignment Sent Successfully! ✅'); 
        fileInput.value = ""; 
        const res = await fetch(`http://localhost:5000/api/courses/student/${user.id}/submissions`);
        setMyGrades(await res.json());
        setTimeout(() => { setUploadStatus(''); setSubmittingLectureId(null); }, 3000);
      } else { setUploadStatus('Failed to submit assignment.'); }
    } catch (error) { setUploadStatus('Error connecting to server.'); }
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
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      alert("Error connecting to the server.");
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };
  
  if (!user) return null;

  const ProgressCircle = ({ radius, stroke, progress }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    return (
      <svg height={radius * 2} width={radius * 2} className="progress-ring">
        <circle strokeWidth={stroke} className="progress-ring__circle progress-ring__circle--bg" r={normalizedRadius} cx={radius} cy={radius} />
        <circle strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset }} className="progress-ring__circle progress-ring__circle--bar" r={normalizedRadius} cx={radius} cy={radius} />
      </svg>
    );
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar light-sidebar">
        <div className="sidebar-header">
          <h2>Student Portal</h2>
          <p>LMS Dashboard</p>
        </div>
        <ul className="nav-links">
          <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => {setActiveTab('courses'); setActiveCourse(null);}}>📚 My Courses</li>
          <li className={activeTab === 'submissions' ? 'active' : ''} onClick={() => {setActiveTab('submissions'); setActiveCourse(null);}}>📝 Assignments</li>
          <li className={activeTab === 'grades' ? 'active' : ''} onClick={() => {setActiveTab('grades'); setActiveCourse(null);}}>📊 Grade History</li>
        </ul>
        <div style={{ padding: '20px', marginTop: 'auto' }}>
          <button className="btn btn-outline w-full" onClick={handleLogout}>Log Out</button>
        </div>
      </aside>

      <main className="main-content student-layout">
        <div className="top-profile-bar">
          <div className="breadcrumb">
            {activeTab === 'courses' && !activeCourse ? 'Dashboard / Overview' : 
             activeCourse ? `Courses / ${activeCourse.title}` : 
             activeTab === 'profile' ? 'Dashboard / Profile Settings' : 
             activeTab === 'submissions' ? 'Dashboard / Required Submissions' : 'Dashboard / Grades'}
          </div>
          <div className="profile-info" onClick={() => { setActiveTab('profile'); setActiveCourse(null); }} style={{ cursor: 'pointer' }} title="Profile Settings">
            <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
            <span>{user.name}</span>
          </div>
        </div>

        {activeTab === 'profile' && (
          <div className="section-card profile-settings-card">
            <h2><span>👤</span> Profile Settings</h2>
            
            <form className="create-course-form" onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
              </div>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={dob} onChange={handleDobChange} />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" value={age} readOnly placeholder="--" style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} title="Age is calculated automatically" />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" defaultValue={user?.email} readOnly style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button type="submit" className="btn mt-4 w-full">Save Changes</button>
            </form>
            
          </div>
        )}

        {activeTab === 'courses' && !activeCourse && (
          <>
            <div className="overview-header mb-4">
              <h1>Welcome, {user.name} 👋</h1>
              <h2>Course overview</h2>
            </div>
            <div className="course-grid">
              {courses.map(course => (
                <div key={course.id || course._id} className="course-card" onClick={() => setActiveCourse(course)}>
                  <div className={`card-image-header ${course.posterUrl ? '' : 'card-image-header-fallback'}`} style={{ backgroundImage: course.posterUrl ? `url("http://localhost:5000/${course.posterUrl.replace(/\\/g, '/')}")` : '' }}></div>
                  <div className="card-body">
                    <h4 className="card-title">{course.title}</h4>
                    <div className="card-meta">
                      <span className="card-score">🎬 {course.lectures?.length || 0} Videos</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>View Module →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'courses' && activeCourse && (
          <div>
            <button className="btn btn-outline mb-4" onClick={() => {setActiveCourse(null); setUploadStatus('');}}>← Back to Overview</button>
            <div className="student-course-header">
                <h1>{activeCourse.title}</h1>
                <div className="student-progress-box"><ProgressCircle radius={18} stroke={4} progress={calculateProgress()} /><span>Module Progress: {calculateProgress()}%</span></div>
            </div>
            {activeCourse.lectures && activeCourse.lectures.length > 0 ? (
                activeCourse.lectures.map((lecture, index) => {
                    
                    // FIX: Extract lecture ID safely and check against our database array
                    const lectureId = lecture._id || lecture.id;
                    const isDone = completedVideos.includes(lectureId); 
                    
                    const hasSubmitted = checkSubmission(activeCourse.title, lecture.title);
                    const isOverdue = checkIsOverdue(lecture.assignmentDeadline);

                    return (
                        <div key={index} className="section-card">
                            <div className="student-lecture-item">
                                <div className="lecture-title-box"><span className={`lecture-number ${isDone ? 'done' : ''}`}>{index + 1}</span><span>{lecture.title}</span></div>
                                {/* FIX: Button now passes the lectureId */}
                                <button className={`btn-mark-done ${isDone ? 'done' : ''}`} onClick={() => toggleMarkDone(lectureId)}>{isDone ? 'Done ✅' : 'Mark as Done'}</button>
                            </div>
                            <div className="video-wrapper">
                                <video controls className="responsive-video"><source src={`http://localhost:5000/${lecture.videoUrl.replace(/\\/g, '/')}`} type="video/mp4" /></video>
                            </div>
                            
                            {lecture.assignmentPrompt && (
                                <div className="lecture-assessment-container">
                                    <h3>Attached Assignment Worksheet</h3>
                                    <div className="assessment-prompt-box">
                                        <p>Teacher has attached an instruction file:</p>
                                        <a href={`http://localhost:5000/${lecture.assignmentPrompt.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="btn">Download 📥</a>
                                    </div>
                                    
                                    {lecture.assignmentDeadline && !hasSubmitted && (
                                        <div style={{ marginBottom: '24px' }}>
                                            Submission Deadline: <span className="badge-deadline">{getDaysRemainingText(lecture.assignmentDeadline)}</span>
                                        </div>
                                    )}

                                    {hasSubmitted ? (
                                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0', fontWeight: '600', textAlign: 'center' }}>
                                            Assignment Uploaded ✅
                                        </div>
                                    ) : isOverdue ? (
                                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', fontWeight: '600', textAlign: 'center' }}>
                                            Submission Closed: The deadline has passed. 🔒
                                        </div>
                                    ) : (
                                        <>
                                            <form onSubmit={(e) => handleFileUpload(e, lectureId)} className="upload-area">
                                                <p style={{ fontWeight: '600', marginBottom: '12px' }}>Upload Your Completed Work (Word or PDF only)</p>
                                                <input type="file" required accept=".pdf,.doc,.docx" />
                                                <button type="submit" className="btn" disabled={submittingLectureId === lectureId}>
                                                    {submittingLectureId === lectureId ? 'Uploading...' : 'Send Assignment'}
                                                </button>
                                            </form>
                                            {uploadStatus && submittingLectureId === lectureId && (
                                                <p className="upload-status" style={{ color: uploadStatus.includes('Failed') ? 'var(--danger)' : 'var(--success)' }}>{uploadStatus}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (<div className="section-card"><h3>No video lectures uploaded yet.</h3></div>)}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="section-card">
             <h3>Pending Assessments</h3><p className="course-desc mb-4">A complete list of video-based assignments required for completion.</p>
             <div className="table-responsive mt-4">
               <table className="grading-table">
                 <thead><tr><th>Course (Subject)</th><th>Video Module</th><th>Action / Deadline</th></tr></thead>
                 <tbody>
                   {courses.length === 0 ? (<tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>You aren't enrolled in any courses.</td></tr>) : (
                       courses.flatMap(course => (course.lectures || []).filter(lec => lec.assignmentPrompt).map(lecture => ({ courseTitle: course.title, lectureTitle: lecture.title, deadline: lecture.assignmentDeadline, prompt: lecture.assignmentPrompt, originalCourse: course }))).length === 0 ? (<tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No required assessments found across your subjects.</td></tr>) : (
                        courses.flatMap(course => (course.lectures || []).filter(lec => lec.assignmentPrompt).map(lecture => ({ courseTitle: course.title, lectureTitle: lecture.title, deadline: lecture.assignmentDeadline, prompt: lecture.assignmentPrompt, originalCourse: course }))).map((item, idx) => {
                           const isSubmitted = checkSubmission(item.courseTitle, item.lectureTitle);
                           const isOverdue = checkIsOverdue(item.deadline);

                           return (
                             <tr key={idx}>
                               <td style={{ fontWeight: '600' }}>{item.courseTitle}</td>
                               <td>{item.lectureTitle}</td>
                               <td>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                   {isSubmitted ? (
                                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Assignment Uploaded ✅</span>
                                   ) : isOverdue ? (
                                      <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Submission Closed 🔒</span>
                                   ) : (
                                      <button className="btn" style={{ fontSize: '0.85rem', padding: '6px 12px', backgroundColor: 'var(--warning)', color: '#fff', border: 'none' }} onClick={() => { setActiveTab('courses'); setActiveCourse(item.originalCourse); }}>Pending Upload</button>
                                   )} 
                                   
                                   {!isSubmitted && (
                                     item.deadline ? <span className="badge-deadline">{getDaysRemainingText(item.deadline)}</span> : <span className="badge-pending">No Deadline</span>
                                   )}
                                 </div>
                               </td>
                             </tr>
                           )
                        })
                       )
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="section-card">
             <h3>Grading History Desk</h3>
             <div className="table-responsive mt-4">
               <table className="grading-table">
                 <thead><tr><th>Subject</th><th>Video/Module Name</th><th>Date Submitted</th><th>My File</th><th>Status / Grade</th></tr></thead>
                 <tbody>
                   {myGrades.length === 0 ? (<tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No graded submissions yet.</td></tr>) : (
                     myGrades.map((grade) => (
                       <tr key={grade.id}>
                         <td style={{ fontWeight: '600' }}>{grade.Course.title}</td>
                         <td style={{ fontWeight: '500' }}>{grade.Lecture.title}</td>
                         <td>{new Date(grade.createdAt).toLocaleDateString()}</td>
                         
                         {/* FIX: Safely handles missing files from ghost submissions! */}
                         <td>
                           {grade.fileUrl ? (
                             <a href={`http://localhost:5000/${grade.fileUrl.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer">📄 View Document</a>
                           ) : (
                             <span style={{ color: 'var(--danger)', fontWeight: '500' }}>No File Uploaded</span>
                           )}
                         </td>

                         <td>{grade.grade !== null ? <div><span className="badge-success">Score: {grade.grade}</span>{grade.feedback && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>Feedback: "{grade.feedback}"</div>}</div> : <span className="badge-pending">Pending Review</span>}</td>
                       </tr>
                     ))
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

export default StudentDashboard;