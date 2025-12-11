import { useState, useEffect } from 'react';
import { postboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CreatePostboardModal from './CreatePostModal';

export default function PostboardList({ onSelectPostboard, onCreatePost }) {
  const [postboards, setPostboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadPostboards();
  }, []);

  const loadPostboards = async () => {
    try {
      setLoading(true);
      const response = await postboardAPI.getAll();
      setPostboards(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load postboards');
    } finally {
      setLoading(false);
    }
  };

  const handlePostboardCreated = () => {
    setShowCreateModal(false);
    loadPostboards();
  };

  if (loading) {
    return <div className="loading">Loading postboards...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button className="btn btn-primary" onClick={loadPostboards}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>All Postboards</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowCreateModal(true)}>
            + New Postboard
          </button>
          <button className="btn btn-primary" onClick={onCreatePost}>
            ✍️ Create Post
          </button>
        </div>
      </div>

      {postboards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No postboards yet</h3>
          <p>Create the first postboard to get started!</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            Create Postboard
          </button>
        </div>
      ) : (
        <div className="postboard-grid">
          {postboards.map(postboard => (
            <div 
              key={postboard.Postboard_ID} 
              className="postboard-card"
              onClick={() => onSelectPostboard(postboard)}
            >
              <h3>{postboard.Postboard_Name || `Postboard #${postboard.Postboard_ID}`}</h3>
              {postboard.Postboard_Description && (
                <p className="postboard-description">{postboard.Postboard_Description}</p>
              )}
              <div className="postboard-meta">
                <p>📝 {postboard.post_count} {postboard.post_count === 1 ? 'post' : 'posts'}</p>
                <p>👤 @{postboard.username || 'Anonymous'}</p>
                <p>🕒 {new Date(postboard.Postboard_TimeStamp).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePostboardModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostboardCreated}
        />
      )}
    </div>
  );
}