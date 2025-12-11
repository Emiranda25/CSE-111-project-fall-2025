import Database from 'better-sqlite3';

const db = new Database('postboard.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables based on the schema diagram
export function initializeDatabase() {
  // USER table
  db.exec(`
    CREATE TABLE IF NOT EXISTS USER (
      User_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      uc_CourseInfo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uc_CourseInfo) REFERENCES UCinfo(uc_CourseInfo)
    )
  `);

  // UCinfo table (UC Course Info)
  db.exec(`
    CREATE TABLE IF NOT EXISTS UCinfo (
      uc_CourseInfo TEXT PRIMARY KEY,
      uc_Name TEXT NOT NULL,
      uc_Term TEXT NOT NULL
    )
  `);

  // PostBoard table
  db.exec(`
    CREATE TABLE IF NOT EXISTS PostBoard (
      Postboard_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Postboard_Name TEXT NOT NULL,
      Postboard_Description TEXT,
      Postboard_TimeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      Hidden_Post INTEGER DEFAULT 0,
      User_ID INTEGER,
      FOREIGN KEY (User_ID) REFERENCES USER(User_ID)
    )
  `);

  // Post table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Post (
      Post_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Post_title TEXT NOT NULL,
      Post_TimeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      Post_type TEXT NOT NULL,
      Post_content TEXT,
      User_ID INTEGER,
      FOREIGN KEY (User_ID) REFERENCES USER(User_ID)
    )
  `);

  // Unique_Postboard_Post junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Unique_Postboard_Post (
      Postboard_ID INTEGER,
      Post_ID INTEGER,
      PRIMARY KEY (Postboard_ID, Post_ID),
      FOREIGN KEY (Postboard_ID) REFERENCES PostBoard(Postboard_ID) ON DELETE CASCADE,
      FOREIGN KEY (Post_ID) REFERENCES Post(Post_ID) ON DELETE CASCADE
    )
  `);

  // Event table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Event (
      Event_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Event_name TEXT NOT NULL,
      Event_Location TEXT,
      Event_attendance INTEGER DEFAULT 0,
      Event_time DATETIME,
      Event_type TEXT,
      Post_ID INTEGER,
      FOREIGN KEY (Post_ID) REFERENCES Post(Post_ID) ON DELETE CASCADE
    )
  `);

  // Comment table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Comment (
      Comment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Comment_TimeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      Comment_content TEXT,
      User_ID INTEGER,
      FOREIGN KEY (User_ID) REFERENCES USER(User_ID)
    )
  `);

  // Engage_Post junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Engage_Post (
      Post_ID INTEGER,
      Comment_ID INTEGER,
      PRIMARY KEY (Post_ID, Comment_ID),
      FOREIGN KEY (Post_ID) REFERENCES Post(Post_ID) ON DELETE CASCADE,
      FOREIGN KEY (Comment_ID) REFERENCES Comment(Comment_ID) ON DELETE CASCADE
    )
  `);

  // Create some UC courses
  const insertUC = db.prepare('INSERT OR IGNORE INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term) VALUES (?, ?, ?)');
  const ucCourses = [
    ['CSE160', 'Computer Networks', 'Fall 2024'],
    ['CSE120', 'Computer Architecture', 'Fall 2024'],
    ['CSE100', 'Algorithm Design', 'Spring 2024']
  ];
  ucCourses.forEach(course => insertUC.run(...course));

  // Create sample users (password is 'password123' hashed with bcrypt)
  const insertUser = db.prepare('INSERT OR IGNORE INTO USER (email, username, password_hash, uc_CourseInfo) VALUES (?, ?, ?, ?)');
  const samplePasswordHash = '$2b$10$rKqV7CZ9Y4kKxH4nQj3rGOqKT0fxV8YqN0OxWzGqE4kJ5hZJqp8.K'; // 'password123'
  const users = [
    ['student1@ucmerced.edu', 'alice_chen', samplePasswordHash, 'CSE160'],
    ['student2@ucmerced.edu', 'bob_smith', samplePasswordHash, 'CSE160'],
    ['student3@ucmerced.edu', 'charlie_wu', samplePasswordHash, 'CSE120']
  ];
  users.forEach(user => insertUser.run(...user));

  // Create sample postboards
  const checkPostboard = db.prepare('SELECT COUNT(*) as count FROM PostBoard');
  if (checkPostboard.get().count === 0) {
    const insertPostboard = db.prepare('INSERT INTO PostBoard (Postboard_Name, Postboard_Description, User_ID) VALUES (?, ?, ?)');
    insertPostboard.run('General Discussion', 'Share anything related to UC Merced!', 1);
    insertPostboard.run('CSE 160 - Computer Networks', 'Course discussions, homework help, and study groups', 1);
    insertPostboard.run('Campus Events', 'Upcoming events, meetups, and activities', 2);
  }

  console.log('Database initialized successfully');
}

export default db;