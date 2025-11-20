-- USERS
INSERT INTO USER (User_ID, email)
VALUES (1, 'alice@ucmerced.edu');

INSERT INTO USER (User_ID, email)
VALUES (2, 'bob@ucmerced.edu');


-- UCINFO
INSERT INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term, User_ID)
VALUES ('CSE120', 'Alice Chen', 'Fall2025', 1);

INSERT INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term, User_ID)
VALUES ('CSE160', 'Bob Rivera', 'Fall2025', 2);


-- POSTBOARDS
INSERT INTO PostBoard (Postboard_ID, Postboard_TimeStamp, Hidden_Post)
VALUES (10, '2025-11-01 09:00:00', 0);

INSERT INTO PostBoard (Postboard_ID, Postboard_TimeStamp, Hidden_Post)
VALUES (11, '2025-11-02 13:30:00', 1);


-- POSTS
INSERT INTO Post (Post_ID, Post_TimeStamp, Post_type)
VALUES (100, '2025-11-01 10:00:00', 'Information');

INSERT INTO Post (Post_ID, Post_TimeStamp, Post_type)
VALUES (101, '2025-11-02 14:00:00', 'Mood');


-- POST ↔ POSTBOARD LINK
INSERT INTO UniquePostboardPost (Postboard_ID, Post_ID)
VALUES (10, 100);

INSERT INTO UniquePostboardPost (Postboard_ID, Post_ID)
VALUES (11, 101);


-- COMMENTS
INSERT INTO Comment (Comment_ID, Comment_TimeStamp)
VALUES (900, '2025-11-02 14:05:00');


-- COMMENT ↔ POST LINK
INSERT INTO EngagePost (Post_ID, Comment_ID)
VALUES (100, 900);


-- EVENT
INSERT INTO Event (Event_name, Event_Location, Event_attendence, Event_time, Event_type, Post_ID)
VALUES ('STEM Club Meeting', 'ACS 120', 45, '2025-11-04 17:00:00', 'Club', 100);
