--The following are examples of SQL quries. NOTE: assuming you did not build this code before run make_schema.sql then inserting_data.sql
--After. - Elvis

--The following 5 queries demostrate us INSERTING Data into our SQL database 
------------------------------------------------------------
.print "1. Insert new user"
INSERT INTO USER (User_ID, email)
VALUES (3, 'charlie@ucmerced.edu');


------------------------------------------------------------
.print "2. Add UCinfo for Charlie"
INSERT INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term, User_ID)
VALUES ('CSE111', 'Charlie Gomez', 'Fall2025', 3);


------------------------------------------------------------
.print "3. Create new PostBoard"
INSERT INTO PostBoard (Postboard_ID, Postboard_TimeStamp, Hidden_Post)
VALUES (12, '2025-11-05 12:00:00', 0);


------------------------------------------------------------
.print "4. Create new Post"
INSERT INTO Post (Post_ID, Post_TimeStamp, Post_type)
VALUES (103, '2025-11-05 12:05:00', 'Information');


------------------------------------------------------------
.print "5. Link new Post to new PostBoard"
INSERT INTO UniquePostboardPost (Postboard_ID, Post_ID)
VALUES (12, 103);


------------------------------------------------------------
--The following 4 queries update user info
.print "6. Update a user's email"
UPDATE USER
SET email = 'alice.updated@ucmerced.edu'
WHERE User_ID = 1;


------------------------------------------------------------
.print "7. Hide all PostBoards before 2025-11-02"
UPDATE PostBoard
SET Hidden_Post = 1
WHERE Postboard_TimeStamp < '2025-11-02';


------------------------------------------------------------
.print "8. Update Post type"
UPDATE Post
SET Post_type = 'Announcement'
WHERE Post_ID = 100;


------------------------------------------------------------
.print "9. Update Event attendance"
UPDATE Event
SET Event_attendence = 50
WHERE Event_name = 'STEM Club Meeting';


------------------------------------------------------------
.print "10. Update Event location"
UPDATE Event
SET Event_Location = 'SE2 110'
WHERE Post_ID = 100;


------------------------------------------------------------
--The 3 queries delete from the tables
.print "11. Delete a comment→post link"
DELETE FROM EngagePost
WHERE Comment_ID = 900;


------------------------------------------------------------
.print "12. Delete the comment itself"
DELETE FROM Comment
WHERE Comment_ID = 900;


------------------------------------------------------------
.print "13. Delete a post"
DELETE FROM Post
WHERE Post_ID = 101;


------------------------------------------------------------
-- SELCECTING Queries and filtering next 4
.print "14. SELECT visible posts (JOIN postboard)"
SELECT p.Post_ID, p.Post_Type, pb.Postboard_ID
FROM Post p
JOIN UniquePostboardPost upp ON p.Post_ID = upp.Post_ID
JOIN PostBoard pb ON pb.Postboard_ID = upp.Postboard_ID
WHERE pb.Hidden_Post = 0;


------------------------------------------------------------
.print "15. SELECT all users with UCinfo"
SELECT USER.User_ID, USER.email, UCinfo.uc_CourseInfo, UCinfo.uc_Term
FROM USER
JOIN UCinfo ON USER.User_ID = UCinfo.User_ID;


------------------------------------------------------------
.print "16. SELECT count of posts per PostBoard"
SELECT Postboard_ID, COUNT(Post_ID) AS NumPosts
FROM UniquePostboardPost
GROUP BY Postboard_ID;


------------------------------------------------------------
.print "17. SELECT all comments for Post 100"
SELECT c.Comment_ID, c.Comment_TimeStamp
FROM Comment c
JOIN EngagePost e ON c.Comment_ID = e.Comment_ID
WHERE e.Post_ID = 100;


------------------------------------------------------------
--The Next 2 Queries are Complex Queries wehere we join multiple tables
.print "18. COMPLEX JOIN: posts + comments + board + user"
SELECT 
    p.Post_ID,
    p.Post_Type,
    c.Comment_ID,
    pb.Postboard_ID,
    u.email
FROM Post p
JOIN EngagePost ep ON p.Post_ID = ep.Post_ID
JOIN Comment c ON ep.Comment_ID = c.Comment_ID
JOIN UniquePostboardPost upp ON p.Post_ID = upp.Post_ID
JOIN PostBoard pb ON upp.Postboard_ID = pb.Postboard_ID
JOIN USER u ON u.User_ID = 1;


------------------------------------------------------------
.print "19. COMPLEX JOIN: event + post + board + user + UCinfo"
SELECT 
    e.Event_name,
    e.Event_time,
    p.Post_type,
    pb.Postboard_TimeStamp,
    uc.uc_Name,
    uc.uc_CourseInfo
FROM Event e
JOIN Post p ON e.Post_ID = p.Post_ID
JOIN UniquePostboardPost upp ON p.Post_ID = upp.Post_ID
JOIN PostBoard pb ON upp.Postboard_ID = pb.Postboard_ID
JOIN USER u ON u.User_ID = 1
JOIN UCinfo uc ON u.User_ID = uc.User_ID;


------------------------------------------------------------
--Multistep Query

.print "20A. USE-CASE: Add comment then attach"
INSERT INTO Comment (Comment_ID, Comment_TimeStamp)
VALUES (902, '2025-11-06 09:00:00');

INSERT INTO EngagePost (Post_ID, Comment_ID)
VALUES (103, 902);


------------------------------------------------------------
.print "20B. USE-CASE: Create event then update attendance"
INSERT INTO Event (Event_name, Event_Location, Event_attendence, Event_time, Event_type, Post_ID)
VALUES ('Hackathon', 'SAAC 203', 120, '2025-11-10 18:00:00', 'Competition', 103);

UPDATE Event
SET Event_attendence = 125
WHERE Event_name = 'Hackathon';


