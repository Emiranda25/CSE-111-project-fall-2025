import { useState, useEffect } from 'react';
import { postboardAPI, postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Post from './Post';

export default function PostboardView({ postboard, onBack, onCreatePost }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'events'
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    loadPosts();
  }, [postboard, postboard.refresh]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await postboardAPI.getById(postboard.Postboard_ID);
      setPosts(response.data.posts || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = () => {
    loadPosts(); // Refresh posts to update comment counts
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await postAPI.delete(postId);
      toast.success('Post deleted successfully');
      loadPosts();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error('Failed to delete post: ' + errorMsg);
    }
  };

  const filteredPosts = activeTab === 'events' 
    ? posts.filter(post => post.Post_type === 'event')
    : posts;

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="back-button">
          <button className="btn btn-outline btn-small" onClick={onBack}>
            ← Back to Postboards
          </button>
        </div>
        <div className="error">
          <p>Error: {error}</p>
          <button className="btn btn-primary" onClick={loadPosts}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="back-button">
        <button className="btn btn-outline btn-small" onClick={onBack}>
          ← Back to Postboards
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>{postboard.Postboard_Name || `Postboard #${postboard.Postboard_ID}`}</h2>
          {postboard.Postboard_Description && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {postboard.Postboard_Description}
            </p>
          )}
        </div>
        <button className="btn btn-primary" onClick={onCreatePost}>
          ✍️ Create Post
        </button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Posts ({posts.length})
        </button>
        <button 
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events ({posts.filter(p => p.Post_type === 'event').length})
        </button>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {activeTab === 'events' ? '📅' : '💬'}
          </div>
          <h3>
            {activeTab === 'events' 
              ? 'No events posted yet' 
              : 'No posts yet'}
          </h3>
          <p>
            {activeTab === 'events' 
              ? 'Create an event to get started!' 
              : 'Be the first to post!'}
          </p>
          <button className="btn btn-primary" onClick={onCreatePost}>
            Create Post
          </button>
        </div>
      ) : (
        filteredPosts.map(post => (
          <Post 
            key={post.Post_ID} 
            post={post}
            currentUser={user}
            onCommentAdded={handleCommentAdded}
            onDelete={handleDeletePost}
          />
        ))
      )}
    </div>
  );
}