const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

let db;
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Initialize database
async function initDatabase() {
    const SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }
    
    // Add missing columns/tables for our app to work
    // These ALTER statements will fail silently if columns already exist
    try {
        // Add password to USER table
        db.run("ALTER TABLE USER ADD COLUMN password TEXT DEFAULT '12345'");
    } catch(e) {}
    
    try {
        // Add content and user_id to Post table  
        db.run("ALTER TABLE Post ADD COLUMN Post_Content TEXT");
    } catch(e) {}
    
    try {
        db.run("ALTER TABLE Post ADD COLUMN User_ID INTEGER");
    } catch(e) {}
    
    try {
        db.run("ALTER TABLE Post ADD COLUMN Post_Reactions TEXT DEFAULT '{}'");
    } catch(e) {}
    
    try {
        // Add board name and description to PostBoard
        db.run("ALTER TABLE PostBoard ADD COLUMN Board_Name TEXT");
    } catch(e) {}
    
    try {
        db.run("ALTER TABLE PostBoard ADD COLUMN Board_Description TEXT");
    } catch(e) {}
    
    try {
        // Add User_ID to Comment
        db.run("ALTER TABLE Comment ADD COLUMN User_ID INTEGER");
    } catch(e) {}
    
    try {
        db.run("ALTER TABLE Comment ADD COLUMN Comment_Content TEXT");
    } catch(e) {}
    
    try {
        // Add event reactions/interested tracking
        db.run("ALTER TABLE Event ADD COLUMN Event_Going TEXT DEFAULT '[]'");
    } catch(e) {}
    
    try {
        db.run("ALTER TABLE Event ADD COLUMN Event_Interested TEXT DEFAULT '[]'");
    } catch(e) {}
    
    try {
        db.run("ALTER TABLE Event ADD COLUMN Event_Description TEXT");
    } catch(e) {}
    
    // Create default data if tables are empty
    const userCount = db.exec("SELECT COUNT(*) FROM USER")[0]?.values[0][0] || 0;
    if (userCount === 0) {
        db.run("INSERT INTO USER (email, password) VALUES ('example@email.com', '12345')");
        db.run("INSERT INTO USER (email, password) VALUES ('example2@email.com', '6789')");
        db.run("INSERT INTO USER (email, password) VALUES ('example3@email.com', '102030')");
        
        db.run("INSERT INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term, User_ID) VALUES ('CSE111', 'juan', 'Fall2025', 1)");
        db.run("INSERT INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term, User_ID) VALUES ('CSE111', 'john', 'Fall2025', 2)");
        db.run("INSERT INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term, User_ID) VALUES ('CSE111', 'jean', 'Fall2025', 3)");
    }
    
    // Update existing UCinfo to have names for our default users
    db.run("UPDATE UCinfo SET uc_Name = 'juan' WHERE User_ID = 1 AND uc_Name IS NULL");
    
    // Create default board if none exist with names
    const boardCheck = db.exec("SELECT * FROM PostBoard WHERE Board_Name IS NOT NULL LIMIT 1");
    if (boardCheck.length === 0) {
        db.run("UPDATE PostBoard SET Board_Name = 'cse 111', Board_Description = 'A place to discuss class' WHERE Postboard_ID = 10");
        db.run("UPDATE PostBoard SET Board_Name = 'cse 120', Board_Description = 'Software Engineering discussions' WHERE Postboard_ID = 11");
        db.run("UPDATE PostBoard SET Board_Name = 'General', Board_Description = 'General discussions' WHERE Postboard_ID = 12");
    }
    
    // Add sample post content
    db.run("UPDATE Post SET Post_Content = 'hello world', User_ID = 1 WHERE Post_ID = 100 AND Post_Content IS NULL");
    db.run("UPDATE Post SET Post_Content = 'Welcome to the class!', User_ID = 1 WHERE Post_ID = 103 AND Post_Content IS NULL");
    
    saveDatabase();
    console.log('Database initialized');
}

// Save database to file
function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// ============ AUTH ROUTES ============

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    const result = db.exec(`
        SELECT u.User_ID, u.email, uc.uc_Name, uc.uc_CourseInfo, uc.uc_Term
        FROM USER u
        LEFT JOIN UCinfo uc ON u.User_ID = uc.User_ID
        WHERE u.email = '${email}' AND u.password = '${password}'
        LIMIT 1
    `);
    
    if (result.length > 0 && result[0].values.length > 0) {
        const [userId, userEmail, name, course, term] = result[0].values[0];
        res.json({ 
            success: true, 
            user: { 
                id: userId, 
                email: userEmail, 
                username: name || email.split('@')[0],
                course: course || '',
                term: term || ''
            } 
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Signup
app.post('/api/signup', (req, res) => {
    const { username, email, password, course, term } = req.body;
    
    // Check if email exists
    const existing = db.exec(`SELECT User_ID FROM USER WHERE email = '${email}'`);
    if (existing.length > 0 && existing[0].values.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    // Insert new user
    db.run(`INSERT INTO USER (email, password) VALUES ('${email}', '${password}')`);
    const userResult = db.exec(`SELECT User_ID FROM USER WHERE email = '${email}'`);
    const userId = userResult[0].values[0][0];
    
    // Insert UCinfo with username, course, and term
    const ucCourse = course || 'General';
    const ucTerm = term || 'Fall2025';
    db.run(`INSERT INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term, User_ID) VALUES ('${ucCourse}', '${username}', '${ucTerm}', ${userId})`);
    
    saveDatabase();
    res.json({ success: true, user: { id: userId, email, username, course: ucCourse, term: ucTerm } });
});

// Update Profile
app.put('/api/profile', (req, res) => {
    const { userId, username, course, term } = req.body;
    
    // Update UCinfo
    db.run(`UPDATE UCinfo SET uc_Name = '${username}', uc_CourseInfo = '${course}', uc_Term = '${term}' WHERE User_ID = ${userId}`);
    
    saveDatabase();
    res.json({ success: true, user: { id: userId, username, course, term } });
});

// ============ BOARD ROUTES ============

// Get all boards
app.get('/api/boards', (req, res) => {
    const result = db.exec(`
        SELECT Postboard_ID, Board_Name, Board_Description, Postboard_TimeStamp
        FROM PostBoard 
        WHERE Board_Name IS NOT NULL
        ORDER BY Postboard_TimeStamp DESC
    `);
    
    const boards = result.length > 0 ? result[0].values.map(row => ({
        id: row[0],
        name: row[1],
        description: row[2],
        timestamp: row[3]
    })) : [];
    
    res.json(boards);
});

// Create board
app.post('/api/boards', (req, res) => {
    const { name, description } = req.body;
    const timestamp = new Date().toISOString();
    
    db.run(`INSERT INTO PostBoard (Postboard_TimeStamp, Hidden_Post, Board_Name, Board_Description) 
            VALUES ('${timestamp}', 0, '${name}', '${description}')`);
    
    const result = db.exec(`SELECT last_insert_rowid()`);
    const boardId = result[0].values[0][0];
    
    saveDatabase();
    res.json({ id: boardId, name, description, timestamp });
});

// ============ POST ROUTES ============

// Get posts for a board
app.get('/api/boards/:boardId/posts', (req, res) => {
    const { boardId } = req.params;
    
    const result = db.exec(`
        SELECT p.Post_ID, p.Post_TimeStamp, p.Post_type, p.Post_Content, p.User_ID, p.Post_Reactions, uc.uc_Name
        FROM Post p
        LEFT JOIN UniquePostboardPost upp ON p.Post_ID = upp.Post_ID
        LEFT JOIN UCinfo uc ON p.User_ID = uc.User_ID
        WHERE upp.Postboard_ID = ${boardId} AND p.Post_type != 'Event'
        ORDER BY p.Post_TimeStamp DESC
    `);
    
    const posts = result.length > 0 ? result[0].values.map(row => {
        let reactions = { like: [], heart: [], smile: [] };
        try {
            reactions = JSON.parse(row[5] || '{}');
        } catch(e) {}
        
        return {
            id: row[0],
            timestamp: row[1],
            type: row[2],
            content: row[3] || '',
            userId: row[4],
            author: row[6] || 'Anonymous',
            reactions,
            comments: []
        };
    }) : [];
    
    // Get comments for each post
    posts.forEach(post => {
        const commentsResult = db.exec(`
            SELECT c.Comment_ID, c.Comment_TimeStamp, c.Comment_Content, c.User_ID, uc.uc_Name
            FROM Comment c
            LEFT JOIN EngagePost ep ON c.Comment_ID = ep.Comment_ID
            LEFT JOIN UCinfo uc ON c.User_ID = uc.User_ID
            WHERE ep.Post_ID = ${post.id}
            ORDER BY c.Comment_TimeStamp ASC
        `);
        
        if (commentsResult.length > 0) {
            post.comments = commentsResult[0].values.map(row => ({
                id: row[0],
                timestamp: row[1],
                text: row[2] || '',
                userId: row[3],
                author: row[4] || 'Anonymous'
            }));
        }
    });
    
    res.json(posts);
});

// Create post
app.post('/api/boards/:boardId/posts', (req, res) => {
    const { boardId } = req.params;
    const { content, userId, type = 'Post' } = req.body;
    const timestamp = new Date().toISOString();
    
    db.run(`INSERT INTO Post (Post_TimeStamp, Post_type, Post_Content, User_ID, Post_Reactions) 
            VALUES ('${timestamp}', '${type}', '${content}', ${userId}, '{}')`);
    
    const postResult = db.exec(`SELECT last_insert_rowid()`);
    const postId = postResult[0].values[0][0];
    
    // Link to board
    db.run(`INSERT INTO UniquePostboardPost (Postboard_ID, Post_ID) VALUES (${boardId}, ${postId})`);
    
    // Get author name
    const authorResult = db.exec(`SELECT uc_Name FROM UCinfo WHERE User_ID = ${userId} LIMIT 1`);
    const author = authorResult.length > 0 ? authorResult[0].values[0][0] : 'Anonymous';
    
    saveDatabase();
    res.json({ 
        id: postId, 
        timestamp, 
        type, 
        content, 
        userId, 
        author,
        reactions: { like: [], heart: [], smile: [] },
        comments: []
    });
});

// Update post
app.put('/api/posts/:postId', (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    
    db.run(`UPDATE Post SET Post_Content = '${content}' WHERE Post_ID = ${postId}`);
    saveDatabase();
    res.json({ success: true });
});

// Delete post
app.delete('/api/posts/:postId', (req, res) => {
    const { postId } = req.params;
    
    db.run(`DELETE FROM UniquePostboardPost WHERE Post_ID = ${postId}`);
    db.run(`DELETE FROM EngagePost WHERE Post_ID = ${postId}`);
    db.run(`DELETE FROM Post WHERE Post_ID = ${postId}`);
    
    saveDatabase();
    res.json({ success: true });
});

// Toggle reaction
app.post('/api/posts/:postId/reactions', (req, res) => {
    const { postId } = req.params;
    const { type, userId } = req.body;
    
    const result = db.exec(`SELECT Post_Reactions FROM Post WHERE Post_ID = ${postId}`);
    let reactions = { like: [], heart: [], smile: [] };
    
    if (result.length > 0 && result[0].values[0][0]) {
        try {
            reactions = JSON.parse(result[0].values[0][0]);
        } catch(e) {}
    }
    
    if (!reactions[type]) reactions[type] = [];
    
    const index = reactions[type].indexOf(userId);
    if (index > -1) {
        reactions[type].splice(index, 1);
    } else {
        reactions[type].push(userId);
    }
    
    db.run(`UPDATE Post SET Post_Reactions = '${JSON.stringify(reactions)}' WHERE Post_ID = ${postId}`);
    saveDatabase();
    res.json(reactions);
});

// Add comment to post
app.post('/api/posts/:postId/comments', (req, res) => {
    const { postId } = req.params;
    const { text, userId } = req.body;
    const timestamp = new Date().toISOString();
    
    db.run(`INSERT INTO Comment (Comment_TimeStamp, Comment_Content, User_ID) 
            VALUES ('${timestamp}', '${text}', ${userId})`);
    
    const commentResult = db.exec(`SELECT last_insert_rowid()`);
    const commentId = commentResult[0].values[0][0];
    
    // Link to post
    db.run(`INSERT INTO EngagePost (Post_ID, Comment_ID) VALUES (${postId}, ${commentId})`);
    
    // Get author name
    const authorResult = db.exec(`SELECT uc_Name FROM UCinfo WHERE User_ID = ${userId} LIMIT 1`);
    const author = authorResult.length > 0 ? authorResult[0].values[0][0] : 'Anonymous';
    
    saveDatabase();
    res.json({ id: commentId, timestamp, text, userId, author });
});

// ============ EVENT ROUTES ============

// Get events for a board
app.get('/api/boards/:boardId/events', (req, res) => {
    const { boardId } = req.params;
    
    const result = db.exec(`
        SELECT e.Event_name, e.Event_Location, e.Event_attendence, e.Event_time, e.Event_type, 
               e.Post_ID, e.Event_Going, e.Event_Interested, e.Event_Description
        FROM Event e
        LEFT JOIN UniquePostboardPost upp ON e.Post_ID = upp.Post_ID
        WHERE upp.Postboard_ID = ${boardId}
        ORDER BY e.Event_time DESC
    `);
    
    const events = result.length > 0 ? result[0].values.map(row => {
        let going = [], interested = [];
        try { going = JSON.parse(row[6] || '[]'); } catch(e) {}
        try { interested = JSON.parse(row[7] || '[]'); } catch(e) {}
        
        return {
            id: row[5],
            title: row[0],
            location: row[1],
            attendance: row[2],
            startDate: row[3],
            type: row[4],
            going,
            interested,
            description: row[8] || '',
            comments: []
        };
    }) : [];
    
    // Get comments for each event
    events.forEach(event => {
        const commentsResult = db.exec(`
            SELECT c.Comment_ID, c.Comment_TimeStamp, c.Comment_Content, c.User_ID, uc.uc_Name
            FROM Comment c
            LEFT JOIN EngagePost ep ON c.Comment_ID = ep.Comment_ID
            LEFT JOIN UCinfo uc ON c.User_ID = uc.User_ID
            WHERE ep.Post_ID = ${event.id}
            ORDER BY c.Comment_TimeStamp ASC
        `);
        
        if (commentsResult.length > 0) {
            event.comments = commentsResult[0].values.map(row => ({
                id: row[0],
                timestamp: row[1],
                text: row[2] || '',
                userId: row[3],
                author: row[4] || 'Anonymous'
            }));
        }
    });
    
    res.json(events);
});

// Create event
app.post('/api/boards/:boardId/events', (req, res) => {
    const { boardId } = req.params;
    const { title, description, type, startDate, endDate, location, userId } = req.body;
    const timestamp = new Date().toISOString();
    
    // Create a post entry for the event
    db.run(`INSERT INTO Post (Post_TimeStamp, Post_type, Post_Content, User_ID) 
            VALUES ('${timestamp}', 'Event', '${description}', ${userId})`);
    
    const postResult = db.exec(`SELECT last_insert_rowid()`);
    const postId = postResult[0].values[0][0];
    
    // Link to board
    db.run(`INSERT INTO UniquePostboardPost (Postboard_ID, Post_ID) VALUES (${boardId}, ${postId})`);
    
    // Create event
    db.run(`INSERT INTO Event (Event_name, Event_Location, Event_attendence, Event_time, Event_type, Post_ID, Event_Going, Event_Interested, Event_Description) 
            VALUES ('${title}', '${location}', 0, '${startDate}', '${type}', ${postId}, '[]', '[]', '${description}')`);
    
    saveDatabase();
    res.json({ 
        id: postId,
        title,
        description,
        type,
        startDate,
        endDate,
        location,
        going: [],
        interested: [],
        comments: []
    });
});

// Toggle event attendance
app.post('/api/events/:eventId/attend', (req, res) => {
    const { eventId } = req.params;
    const { type, userId } = req.body;
    
    const result = db.exec(`SELECT Event_Going, Event_Interested FROM Event WHERE Post_ID = ${eventId}`);
    let going = [], interested = [];
    
    if (result.length > 0) {
        try { going = JSON.parse(result[0].values[0][0] || '[]'); } catch(e) {}
        try { interested = JSON.parse(result[0].values[0][1] || '[]'); } catch(e) {}
    }
    
    // Remove from other list
    if (type === 'going') {
        const intIndex = interested.indexOf(userId);
        if (intIndex > -1) interested.splice(intIndex, 1);
    } else {
        const goIndex = going.indexOf(userId);
        if (goIndex > -1) going.splice(goIndex, 1);
    }
    
    // Toggle current list
    const list = type === 'going' ? going : interested;
    const index = list.indexOf(userId);
    if (index > -1) {
        list.splice(index, 1);
    } else {
        list.push(userId);
    }
    
    db.run(`UPDATE Event SET Event_Going = '${JSON.stringify(going)}', Event_Interested = '${JSON.stringify(interested)}' WHERE Post_ID = ${eventId}`);
    saveDatabase();
    res.json({ going, interested });
});

// ============ START SERVER ============

const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
