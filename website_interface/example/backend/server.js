import express from 'express';
import cors from 'cors';
import db, { initializeDatabase } from './database.js';
import { registerUser, loginUser, getCurrentUser, authenticateToken } from './auth.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', registerUser);

// Login
app.post('/api/auth/login', loginUser);

// Get current user (protected)
app.get('/api/auth/me', authenticateToken, getCurrentUser);

// ==================== USER ROUTES ====================

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM USER').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
app.post('/api/users', (req, res) => {
  try {
    const { email } = req.body;
    const result = db.prepare('INSERT INTO USER (email) VALUES (?)').run(email);
    res.json({ User_ID: result.lastInsertRowid, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== POSTBOARD ROUTES ====================

// Get all postboards
app.get('/api/postboards', (req, res) => {
  try {
    const postboards = db.prepare(`
      SELECT pb.*, u.email, u.username, 
             (SELECT COUNT(*) FROM Unique_Postboard_Post WHERE Postboard_ID = pb.Postboard_ID) as post_count
      FROM PostBoard pb
      LEFT JOIN USER u ON pb.User_ID = u.User_ID
      WHERE Hidden_Post = 0
      ORDER BY Postboard_TimeStamp DESC
    `).all();
    res.json(postboards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single postboard with posts
app.get('/api/postboards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const postboard = db.prepare('SELECT * FROM PostBoard WHERE Postboard_ID = ?').get(id);
    
    if (!postboard) {
      return res.status(404).json({ error: 'Postboard not found' });
    }

    const posts = db.prepare(`
      SELECT p.*, u.email, u.username,
             (SELECT COUNT(*) FROM Engage_Post WHERE Post_ID = p.Post_ID) as comment_count
      FROM Post p
      JOIN Unique_Postboard_Post upp ON p.Post_ID = upp.Post_ID
      LEFT JOIN USER u ON p.User_ID = u.User_ID
      WHERE upp.Postboard_ID = ?
      ORDER BY p.Post_TimeStamp DESC
    `).all(id);

    res.json({ ...postboard, posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create postboard (protected)
app.post('/api/postboards', authenticateToken, (req, res) => {
  try {
    const { Postboard_Name, Postboard_Description } = req.body;
    const User_ID = req.user.User_ID;
    
    if (!Postboard_Name) {
      return res.status(400).json({ error: 'Postboard name is required' });
    }
    
    const result = db.prepare(
      'INSERT INTO PostBoard (Postboard_Name, Postboard_Description, User_ID) VALUES (?, ?, ?)'
    ).run(Postboard_Name, Postboard_Description || '', User_ID);
    
    res.json({ Postboard_ID: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== POST ROUTES ====================

// Get all posts
app.get('/api/posts', (req, res) => {
  try {
    const posts = db.prepare(`
      SELECT p.*, u.email, u.username,
             (SELECT COUNT(*) FROM Engage_Post WHERE Post_ID = p.Post_ID) as comment_count
      FROM Post p
      LEFT JOIN USER u ON p.User_ID = u.User_ID
      ORDER BY p.Post_TimeStamp DESC
    `).all();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single post with comments and event (if applicable)
app.get('/api/posts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const post = db.prepare(`
      SELECT p.*, u.email, u.username
      FROM Post p
      LEFT JOIN USER u ON p.User_ID = u.User_ID
      WHERE p.Post_ID = ?
    `).get(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comments = db.prepare(`
      SELECT c.*, u.email, u.username
      FROM Comment c
      JOIN Engage_Post ep ON c.Comment_ID = ep.Comment_ID
      LEFT JOIN USER u ON c.User_ID = u.User_ID
      WHERE ep.Post_ID = ?
      ORDER BY c.Comment_TimeStamp ASC
    `).all(id);

    const event = db.prepare('SELECT * FROM Event WHERE Post_ID = ?').get(id);

    res.json({ ...post, comments, event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post (protected)
app.post('/api/posts', authenticateToken, (req, res) => {
  try {
    const { Post_title, Post_type, Post_content, Postboard_ID, event } = req.body;
    const User_ID = req.user.User_ID;
    
    // Validate required fields
    if (!Post_title || !Post_type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }
    
    // Insert post
    const postResult = db.prepare(
      'INSERT INTO Post (Post_title, Post_type, Post_content, User_ID) VALUES (?, ?, ?, ?)'
    ).run(Post_title, Post_type, Post_content, User_ID);
    
    const Post_ID = postResult.lastInsertRowid;

    // Link to postboard
    if (Postboard_ID) {
      db.prepare(
        'INSERT INTO Unique_Postboard_Post (Postboard_ID, Post_ID) VALUES (?, ?)'
      ).run(Postboard_ID, Post_ID);
    }

    // If it's an event post, create event
    if (Post_type === 'event' && event) {
      db.prepare(
        'INSERT INTO Event (Event_name, Event_Location, Event_time, Event_type, Post_ID) VALUES (?, ?, ?, ?, ?)'
      ).run(event.name, event.location, event.time, event.type, Post_ID);
    }

    res.json({ Post_ID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
app.delete('/api/posts/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM Post WHERE Post_ID = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMMENT ROUTES ====================

// Create comment (protected)
app.post('/api/comments', authenticateToken, (req, res) => {
  try {
    const { Comment_content, Post_ID } = req.body;
    const User_ID = req.user.User_ID;
    
    if (!Comment_content || !Post_ID) {
      return res.status(400).json({ error: 'Comment content and Post ID are required' });
    }
    
    // Insert comment
    const commentResult = db.prepare(
      'INSERT INTO Comment (Comment_content, User_ID) VALUES (?, ?)'
    ).run(Comment_content, User_ID);
    
    const Comment_ID = commentResult.lastInsertRowid;

    // Link to post
    db.prepare(
      'INSERT INTO Engage_Post (Post_ID, Comment_ID) VALUES (?, ?)'
    ).run(Post_ID, Comment_ID);

    res.json({ Comment_ID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete comment
app.delete('/api/comments/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM Comment WHERE Comment_ID = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EVENT ROUTES ====================

// Get all events
app.get('/api/events', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT e.*, p.Post_content, p.Post_title, u.email, u.username
      FROM Event e
      JOIN Post p ON e.Post_ID = p.Post_ID
      LEFT JOIN USER u ON p.User_ID = u.User_ID
      ORDER BY e.Event_time ASC
    `).all();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event attendance
app.patch('/api/events/:id/attend', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE Event SET Event_attendance = Event_attendance + 1 WHERE Event_ID = ?').run(id);
    const event = db.prepare('SELECT * FROM Event WHERE Event_ID = ?').get(id);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});