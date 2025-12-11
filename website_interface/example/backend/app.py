from flask import Flask, jsonify, request, g
from flask_cors import CORS
import sqlite3
import datetime
import os
import random

app = Flask(__name__)
CORS(app)  # Allows React to talk to Flask

# Ensure we connect to the database correctly even if run from a different directory
BASEjh_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASEjh_DIR, 'tcph.sqlite')

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # Return rows as dictionaries
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# --- API ROUTES ---

@app.route('/api/postboards', methods=['GET'])
def get_postboards():
    cur = get_db().cursor()
    # Fetch all boards. Columns: Postboard_ID, Postboard_TimeStamp, Hidden_Post
    cur.execute("SELECT * FROM PostBoard")
    boards = cur.fetchall()
    return jsonify([dict(ix) for ix in boards])

@app.route('/api/postboards/<int:board_id>/posts', methods=['GET'])
def get_posts(board_id):
    cur = get_db().cursor()
    # Join logic based on your 'queries.sql' examples
    query = """
    SELECT 
        p.Post_ID, 
        p.Post_TimeStamp, 
        p.Post_type,
        e.Event_name,
        e.Event_Location,
        e.Event_time,
        e.Event_type
    FROM Post p
    JOIN UniquePostboardPost upp ON p.Post_ID = upp.Post_ID
    LEFT JOIN Event e ON p.Post_ID = e.Post_ID
    WHERE upp.Postboard_ID = ?
    ORDER BY p.Post_TimeStamp DESC
    """
    cur.execute(query, (board_id,))
    posts = cur.fetchall()
    return jsonify([dict(ix) for ix in posts])

@app.route('/api/post', methods=['POST'])
def create_post():
    data = request.json
    db = get_db()
    cur = db.cursor()

    # 1. Generate ID (finding max ID + 1)
    cur.execute("SELECT MAX(Post_ID) FROM Post")
    max_id_row = cur.fetchone()
    max_id = max_id_row[0] if max_id_row[0] else 100
    new_post_id = max_id + 1

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 2. Insert into Post table
    cur.execute("INSERT INTO Post (Post_ID, Post_TimeStamp, Post_type) VALUES (?, ?, ?)",
                (new_post_id, timestamp, data.get('type', 'Message')))

    # 3. Link to PostBoard
    cur.execute("INSERT INTO UniquePostboardPost (Postboard_ID, Post_ID) VALUES (?, ?)",
                (data['boardId'], new_post_id))

    # 4. If it is an event, Insert into Event table
    if data.get('isEvent'):
        cur.execute("""
            INSERT INTO Event (Event_name, Event_Location, Event_attendence, Event_time, Event_type, Post_ID)
            VALUES (?, ?, 0, ?, 'General', ?)
        """, (data['eventName'], data['eventLocation'], data['eventTime'], new_post_id))

    db.commit()
    return jsonify({'success': True, 'postId': new_post_id})

@app.route('/api/postboards', methods=['POST'])
def create_postboard():
    """Create a new post board."""
    data = request.json or {}
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT MAX(Postboard_ID) FROM PostBoard")
    max_id_row = cur.fetchone()
    max_id = max_id_row[0] if max_id_row[0] else 9
    new_board_id = max_id + 1

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    hidden_post = 1 if data.get('hidden') else 0

    cur.execute(
        "INSERT INTO PostBoard (Postboard_ID, Postboard_TimeStamp, Hidden_Post) VALUES (?, ?, ?)",
        (new_board_id, timestamp, hidden_post)
    )
    db.commit()
    return jsonify({
        'Postboard_ID': new_board_id,
        'Postboard_TimeStamp': timestamp,
        'Hidden_Post': hidden_post
    })

@app.route('/api/seed-john', methods=['POST'])
def seed_john():
    """
    Convenience endpoint to add a demo user named John and attach
    three randomly generated posts to a brand-new board.
    """
    db = get_db()
    cur = db.cursor()

    # Ensure John exists
    cur.execute("SELECT MAX(User_ID) FROM USER")
    max_user_row = cur.fetchone()
    next_user_id = (max_user_row[0] or 0) + 1
    john_email = 'john@ucmerced.edu'
    try:
        cur.execute("INSERT INTO USER (User_ID, email) VALUES (?, ?)", (next_user_id, john_email))
    except sqlite3.IntegrityError:
        # If John already exists, fetch his ID
        cur.execute("SELECT User_ID FROM USER WHERE email = ?", (john_email,))
        existing_user = cur.fetchone()
        next_user_id = existing_user[0] if existing_user else next_user_id

    # Tie John to UCinfo if not present
    cur.execute("SELECT 1 FROM UCinfo WHERE User_ID = ?", (next_user_id,))
    if cur.fetchone() is None:
        cur.execute(
            "INSERT INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term, User_ID) VALUES (?, ?, ?, ?)",
            ("CSE111", "John Doe", "Fall2025", next_user_id)
        )

    # Create a new board for John
    cur.execute("SELECT MAX(Postboard_ID) FROM PostBoard")
    max_board_row = cur.fetchone()
    max_board_id = max_board_row[0] if max_board_row[0] else 9
    john_board_id = max_board_id + 1
    board_timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute(
        "INSERT INTO PostBoard (Postboard_ID, Postboard_TimeStamp, Hidden_Post) VALUES (?, ?, 0)",
        (john_board_id, board_timestamp)
    )

    # Seed three posts on that board
    cur.execute("SELECT MAX(Post_ID) FROM Post")
    max_post_row = cur.fetchone()
    max_post_id = max_post_row[0] if max_post_row[0] else 99

    topics = ["Project Showcase", "Study Group", "Club Meetup", "Exam Review", "Research Talk"]
    locations = ["COB2 110", "SE2 120", "SAAC 203", "Library 2nd Floor", "Granite Pass"]
    post_types = ["Information", "Announcement", "Event"]

    created_posts = []
    for i in range(3):
        new_post_id = max_post_id + i + 1
        post_type = random.choice(post_types)
        post_timestamp = (datetime.datetime.now() + datetime.timedelta(minutes=5 * i)).strftime("%Y-%m-%d %H:%M:%S")

        cur.execute(
            "INSERT INTO Post (Post_ID, Post_TimeStamp, Post_type) VALUES (?, ?, ?)",
            (new_post_id, post_timestamp, post_type)
        )
        cur.execute(
            "INSERT INTO UniquePostboardPost (Postboard_ID, Post_ID) VALUES (?, ?)",
            (john_board_id, new_post_id)
        )

        event_payload = None
        if post_type == "Event":
            event_payload = {
                "name": random.choice(topics),
                "location": random.choice(locations),
                "time": (datetime.datetime.now() + datetime.timedelta(days=i + 1)).strftime("%Y-%m-%d %H:%M:%S"),
                "type": "General"
            }
            cur.execute(
                """
                INSERT INTO Event (Event_name, Event_Location, Event_attendence, Event_time, Event_type, Post_ID)
                VALUES (?, ?, 0, ?, ?, ?)
                """,
                (event_payload["name"], event_payload["location"], event_payload["time"], event_payload["type"], new_post_id)
            )

        created_posts.append({
            "Post_ID": new_post_id,
            "Post_TimeStamp": post_timestamp,
            "Post_type": post_type,
            "Event_name": event_payload["name"] if event_payload else None,
            "Event_Location": event_payload["location"] if event_payload else None,
            "Event_time": event_payload["time"] if event_payload else None,
            "Event_type": event_payload["type"] if event_payload else None,
        })

    db.commit()

    return jsonify({
        "userId": next_user_id,
        "board": {
            "Postboard_ID": john_board_id,
            "Postboard_TimeStamp": board_timestamp,
            "Hidden_Post": 0
        },
        "posts": created_posts
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
