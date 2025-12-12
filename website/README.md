# Post Boards Application

A simple post boards web application with SQLite database backend.

## Database Schema

This app uses the following database structure based on your E/R diagram:

- **USER** - User accounts (User_ID, email, password)
- **UCinfo** - User course info and names (uc_CourseInfo, uc_Name, uc_Term, User_ID)
- **PostBoard** - Discussion boards (Postboard_ID, Board_Name, Board_Description, etc.)
- **Post** - Posts within boards (Post_ID, Post_Content, Post_TimeStamp, User_ID, etc.)
- **Event** - Events within boards (Event_name, Event_Location, Event_time, etc.)
- **Comment** - Comments on posts/events (Comment_ID, Comment_Content, User_ID)
- **UniquePostboardPost** - Links posts to boards
- **EngagePost** - Links comments to posts

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3000`

## Default Users

| Username | Email              | Password |
|----------|--------------------|----------|
| juan     | example@email.com  | 12345    |
| john     | example2@email.com | 6789     |
| jean     | example3@email.com | 102030   |

## API Endpoints

### Authentication
- `POST /api/login` - Login with email/password
- `POST /api/signup` - Create new account

### Boards
- `GET /api/boards` - Get all boards
- `POST /api/boards` - Create a board

### Posts
- `GET /api/boards/:boardId/posts` - Get posts for a board
- `POST /api/boards/:boardId/posts` - Create a post
- `PUT /api/posts/:postId` - Update a post
- `DELETE /api/posts/:postId` - Delete a post
- `POST /api/posts/:postId/reactions` - Toggle reaction
- `POST /api/posts/:postId/comments` - Add comment

### Events
- `GET /api/boards/:boardId/events` - Get events for a board
- `POST /api/boards/:boardId/events` - Create an event
- `POST /api/events/:eventId/attend` - Toggle attendance

## Project Structure

```
postboards-backend/
├── server.js          # Express backend server
├── database.sqlite    # SQLite database file
├── package.json       # Node.js dependencies
└── public/
    └── index.html     # Frontend application
```

## How the Backend Works

1. **sql.js** - Pure JavaScript SQLite implementation (no native compilation needed)
2. **Express** - HTTP server handling API routes
3. **CORS** - Cross-origin resource sharing enabled
4. The database file is read on startup and saved after each modification
