--The following are examples on inserting data to the tables - Elvis

--Insert Basic users
INSERT INTO USER (User_ID, email)
VALUES (1, 'alice@ucmerced.edu'),(2, 'bob@ucmerced.edu');

--Insert UCinfo for erach user
INSERT INTO UCinfo (uc_CourseInfo, uc_Name, uc_Term, User_ID)
VALUES ('CSE120', 'Alice Chen', 'Fall2025', 1),('CSE160', 'Bob Rivera', 'Fall2025', 2);

--Insert 2 PostPostBoards
INSERT INTO PostBoard (Postboard_ID, Postboard_TimeStamp, Hidden_Post)
VALUES (10, '2025-11-01 09:00:00', 0),(11, '2025-11-02 13:30:00', 1);

--Insert Post
INSERT INTO Post (Post_ID, Post_TimeStamp, Post_type)
VALUES (100, '2025-11-01 10:00:00', 'Information'),(101, '2025-11-02 14:00:00', 'Mood');


--Link Post to boards
INSERT INTO UniquePostboardPost (Postboard_ID, Post_ID)
VALUES (10, 100),(11, 101);

--Insert an comment
INSERT INTO Comment (Comment_ID, Comment_TimeStamp)
VALUES (900, '2025-11-02 14:05:00');

--Attach a comment to post
INSERT INTO EngagePost (Post_ID, Comment_ID)
VALUES (100, 900);


--Insert an event linked to a post
INSERT INTO Event (Event_name, Event_Location, Event_attendence, Event_time, Event_type, Post_ID)
VALUES ('STEM Club Meeting', 'ACS 120', 45, '2025-11-04 17:00:00', 'Club', 100);

--End of Example : ) - Elvis