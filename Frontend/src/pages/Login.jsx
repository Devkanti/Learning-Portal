import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState(''); 
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const SECRET_ADMIN_KEY = "ADMIN123";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Initial Check: If using the Admin Portal, the key MUST be correct
    if (isAdminMode) {
      if (adminKey.trim().toUpperCase() !== SECRET_ADMIN_KEY) {
        setError('Wrong administrator ID');
        return;
      }
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const finalRole = isAdminMode ? 'admin' : role;
    const payload = isLogin ? { email, password } : { name, email, password, role: finalRole };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        if (window.PasswordCredential) {
            try {
                const cred = new window.PasswordCredential({ id: email, password: password, name: name || email });
                navigator.credentials.store(cred);
            } catch (err) { console.log("Browser suppressed credential prompt", err); }
        }

        if (isLogin) {
          
          // ================================================================
          // SECURITY FIX: STRICT PORTAL WALLS
          // ================================================================
          
          // Prevent Admins from logging in via the standard student/teacher form
          if (data.user.role === 'admin' && !isAdminMode) {
             setError('System Administrators must log in through the Administrator Access portal.');
             return; 
          }

          // Prevent Students/Teachers from logging in via the Admin form
          if (data.user.role !== 'admin' && isAdminMode) {
             setError('This portal is restricted to Administrators only.');
             return;
          }
          // ================================================================

          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          setTimeout(() => {
            if (data.user.role === 'teacher') navigate('/teacher'); 
            else if (data.user.role === 'admin') navigate('/admin');
            else navigate('/student');
          }, 150);

        } else {
          setIsLogin(true); 
          setError('Account registered securely! You can now log in.');
          setAdminKey(''); 
        }
      } else { 
        setError(data.message || 'Something went wrong.'); 
      }
    } catch (err) { 
      setError('Failed to connect to the server.'); 
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2 style={{ color: isAdminMode ? 'var(--danger)' : 'var(--text-dark)' }}>
            {isAdminMode ? 'System Administration' : isLogin ? 'Sign In to Learning Portal' : 'Create an account'}
          </h2>
          <p>
            {isAdminMode ? 'Authorized personnel only.' : isLogin ? 'Secure access to your educational dashboard.' : 'Join the platform and start learning today.'}
          </p>
        </div>

        {error && (
          <div className="auth-error" style={{ 
            backgroundColor: error.includes('securely') ? '#dcfce7' : '#fee2e2', 
            color: error.includes('securely') ? '#166534' : 'var(--danger)',
            borderColor: error.includes('securely') ? '#166534' : 'var(--danger)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} action="#" method="POST">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required name="name" id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required name="email" id="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input type="password" required name="password" id="password" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {isAdminMode ? (
            <div className="form-group">
              <label style={{ color: 'var(--danger)' }}>Administration Key</label>
              <input type="password" required name="adminKey" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} style={{ borderColor: 'var(--danger)', backgroundColor: '#fef2f2' }} />
            </div>
          ) : (
            !isLogin && (
              <div className="form-group">
                <label>Account Type</label>
                <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="student">Student Account</option>
                  <option value="teacher">Teacher Account</option>
                </select>
              </div>
            )
          )}

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '16px', padding: '14px', backgroundColor: isAdminMode ? 'var(--danger)' : '' }}>
            {isAdminMode ? (isLogin ? 'Admin Login' : 'Register Admin Account') : (isLogin ? 'Secure Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Register here' : 'Log in instead'}
          </span>
        </p>

        <p className="auth-toggle" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-light)' }}>
          {isAdminMode ? (
            <span style={{ color: 'var(--text-muted)' }} onClick={() => { setIsAdminMode(false); setError(''); setAdminKey(''); }}>
              ← Return to Standard Portal
            </span>
          ) : (
            <span style={{ color: 'var(--primary)' }} onClick={() => { setIsAdminMode(true); setError(''); }}>
              Administrator Access
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;