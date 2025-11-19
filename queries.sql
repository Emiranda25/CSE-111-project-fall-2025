--The following are examples of SQL quries. NOTE: assuming you did not build this code before run make_schema.sql then inserting_data.sql
--After. - Elvis

--Adding a new post to the board:
INSERT INTO Post (Post_ID, Post_TimeStamp, Post_type)
VALUES (102, '2025-11-03 08:10:00', 'Rant');
INSERT INTO UniquePostboardPost (Postboard_ID, Post_ID)
VALUES (10, 102);


--Add a comment to a recent psot
INSERT INTO Comment (Comment_ID, Comment_TimeStamp)
VALUES (901, '2025-11-03 08:20:00');

INSERT INTO EngagePost (Post_ID, Comment_ID)
VALUES (102, 901);


--updating user info
UPDATE USER
SET email = 'alice.new@ucmerced.edu'
WHERE User_ID = 1;


--Hiding a post
UPDATE PostBoard
SET Hidden_Post = 1
WHERE Postboard_ID = 10;

--delete a comment
UPDATE PostBoard
SET Hidden_Post = 1
WHERE Postboard_ID = 10;

