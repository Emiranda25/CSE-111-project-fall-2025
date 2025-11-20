-- View all users
.print 'Users'
SELECT * FROM USER;
.print '============================================================================================================================================================='
-- View updated user only
.print 'selected user'
SELECT * FROM USER WHERE User_ID = 1;
.print '============================================================================================================================================================='

-- View all post boards (check Hidden_Post)
.print 'Postboard'
SELECT * FROM PostBoard;
.print '============================================================================================================================================================='

-- View only postboard 10
.print 'Specific PostBoard'
SELECT * FROM PostBoard WHERE Postboard_ID = 10;
.print '============================================================================================================================================================='

-- View all posts
.print 'All Post'
SELECT * FROM Post;
.print '============================================================================================================================================================='
-- View post-board mappings
.print 'Post board layout'
SELECT * FROM UniquePostboardPost;
.print '============================================================================================================================================================='

-- View comments
.print ' view comments'
SELECT * FROM Comment;
.print '============================================================================================================================================================='

-- View comment → post mapping
.print 'post with comments'
SELECT * FROM EngagePost;
.print '============================================================================================================================================================='
-- ============================================================
-- BONUS: Useful JOIN Queries
-- ============================================================

-- Show posts with their board IDs
SELECT 
    Post.Post_ID,
    Post.Post_type,
    Post.Post_TimeStamp,
    UniquePostboardPost.Postboard_ID
FROM Post
JOIN UniquePostboardPost
    ON Post.Post_ID = UniquePostboardPost.Post_ID;

-- Show posts with their comments
SELECT 
    Post.Post_ID,
    Comment.Comment_ID,
    Comment.Comment_TimeStamp
FROM Post
JOIN EngagePost ON Post.Post_ID = EngagePost.Post_ID
JOIN Comment ON EngagePost.Comment_ID = Comment.Comment_ID;

-- Show posts and their events
SELECT 
    Post.Post_ID,
    Event.Event_name,
    Event.Event_time,
    Event.Event_Location
FROM Post
LEFT JOIN Event ON Post.Post_ID = Event.Post_ID;