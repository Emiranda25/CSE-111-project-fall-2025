import { useState } from 'react';
import { postboardAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CreatePostboardModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    Postboard_Name: '',
    Postboard_Description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.Postboard_Name.trim()) {
      const msg = 'Postboard name is required';
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await postboardAPI.create(formData);
      toast.success('Postboard created successfully!');
      onCreated();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create postboard';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Postboard</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label htmlFor="Postboard_Name">Postboard Name *</label>
            <input
              id="Postboard_Name"
              name="Postboard_Name"
              type="text"
              className="form-control"
              value={formData.Postboard_Name}
              onChange={handleChange}
              placeholder="e.g., Study Groups, Campus Events, General Discussion"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="Postboard_Description">Description</label>
            <textarea
              id="Postboard_Description"
              name="Postboard_Description"
              className="form-control"
              value={formData.Postboard_Description}
              onChange={handleChange}
              placeholder="What is this postboard about?"
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Postboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}