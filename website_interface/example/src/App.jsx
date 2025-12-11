import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuthWrapper from './components/AuthWrapper';
import Header from './components/Header';
import PostboardList from './components/PostboardList';
import PostboardView from './components/PostboardView';
import CreatePostModal from './components/CreatePostModal';

function App() {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'postboard'
  const [selectedPostboard, setSelectedPostboard] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSelectPostboard = (postboard) => {
    setSelectedPostboard(postboard);
    setCurrentView('postboard');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPostboard(null);
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    // Refresh the current view
    if (currentView === 'postboard') {
      setSelectedPostboard({ ...selectedPostboard, refresh: Date.now() });
    }
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <AuthWrapper>
          <div className="app">
            <Header />

            <div className="container">
              {currentView === 'list' ? (
                <PostboardList 
                  onSelectPostboard={handleSelectPostboard}
                  onCreatePost={() => setShowCreateModal(true)}
                />
              ) : (
                <PostboardView
                  postboard={selectedPostboard}
                  onBack={handleBackToList}
                  onCreatePost={() => setShowCreateModal(true)}
                />
              )}
            </div>

            {showCreateModal && (
              <CreatePostModal
                postboardId={selectedPostboard?.Postboard_ID}
                onClose={() => setShowCreateModal(false)}
                onPostCreated={handlePostCreated}
              />
            )}
          </div>
        </AuthWrapper>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;