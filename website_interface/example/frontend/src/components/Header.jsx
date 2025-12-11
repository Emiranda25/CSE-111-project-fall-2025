import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>🎓 PostBoard</h1>
          <p>UC Merced Community Forum</p>
        </div>
        
        <div className="header-right">
          {user && (
            <div className="user-menu">
              <div className="user-info">
                <span className="username">@{user.username}</span>
                {user.uc_CourseInfo && (
                  <span className="course-badge">{user.uc_CourseInfo}</span>
                )}
              </div>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;