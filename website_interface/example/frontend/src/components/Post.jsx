import { useState, useEffect } from 'react';
import { postAPI, commentAPI, eventAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Post({ post, currentUser, onCommentAdded, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [event, setEvent] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (showComments) {
      loadPostDetails();
    }
  }, [showComments]);

  const loadPostDetails = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getById(post.Post_ID);
      setComments(response.data.comments || []);
      setEvent(response.data.event);
    } catch (err) {
      console.error('Error loading post details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await commentAPI.create({
        Comment_content: newComment,
        Post_ID: post.Post_ID
      });
      
      setNewComment('');
      loadPostDetails();
      onCommentAdded();
      toast.success('Comment added successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error('Failed to add comment: ' + errorMsg);
    }
  };

  const handleAttendEvent = async () => {
    if (!event) return;
    
    try {
      const response = await eventAPI.markAttendance(event.Event_ID);
      setEvent(response.data);
      toast.success('Attendance marked!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error('Failed to mark attendance: ' + errorMsg);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="post">
      <div className="post-header">
        <div>
          <span className={`post-type-badge post-type-${post.Post_type}`}>
            {post.Post_type === 'event' ? '📅 Event' : '💬 Message'}
          </span>
          <div className="post-user">@{post.username || 'Anonymous'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="post-time">{formatDate(post.Post_TimeStamp)}</div>
          {currentUser?.User_ID === post.User_ID && (
            <button 
              className="btn btn-small" 
              onClick={() => onDelete(post.Post_ID)}
              style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {post.Post_title && (
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {post.Post_title}
        </h3>
      )}

      <div className="post-content">{post.Post_content}</div>

      {post.Post_type === 'event' && event && (
        <div className="event-details">
          <h4>📍 Event Details</h4>
          <div className="event-info">
            <div className="event-info-item">
              <strong>Name:</strong>
              <span>{event.Event_name}</span>
            </div>
            <div className="event-info-item">
              <strong>Location:</strong>
              <span>{event.Event_Location || 'TBA'}</span>
            </div>
            <div className="event-info-item">
              <strong>Time:</strong>
              <span>{event.Event_time ? formatDate(event.Event_time) : 'TBA'}</span>
            </div>
            <div className="event-info-item">
              <strong>Type:</strong>
              <span>{event.Event_type || 'General'}</span>
            </div>
            <div className="event-info-item">
              <strong>Attending:</strong>
              <span>{event.Event_attendance} people</span>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-small" 
            onClick={handleAttendEvent}
            style={{ marginTop: '1rem' }}
          >
            ✓ I'm Attending
          </button>
        </div>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button 
          className="btn btn-small btn-outline"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {post.comment_count} {post.comment_count === 1 ? 'Comment' : 'Comments'}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>Loading comments...</div>
          ) : (
            <>
              <div className="comments-header">Comments</div>
              
              {comments.length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>No comments yet. Be the first to comment!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.Comment_ID} className="comment">
                    <div className="comment-header">
                      <span className="comment-user">@{comment.username || 'Anonymous'}</span>
                      <span className="comment-time">{formatDate(comment.Comment_TimeStamp)}</span>
                    </div>
                    <div className="comment-content">{comment.Comment_content}</div>
                  </div>
                ))
              )}

              <form onSubmit={handleAddComment} style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Add a comment</label>
                  <textarea
                    className="form-control"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your comment..."
                    rows="3"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-small">
                  Post Comment
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}