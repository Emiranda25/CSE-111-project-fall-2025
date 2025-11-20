--This sql code is to generate the schema and tables run this code to build it - Elvis

--User Table
CREATE TABLE USER (
    User_ID INTEGER PRIMARY KEY,
    email TEXT NOT NULL
);

--UCinfo table linked directly to USER
CREATE TABLE UCinfo (
    uc_CourseInfo TEXT,
    uc_Name TEXT,
    uc_Term TEXT,
    User_ID INTEGER UNIQUE,
    PRIMARY KEY (User_ID),
    FOREIGN KEY (User_ID) REFERENCES USER(User_ID)
);

--PostBoard Table
CREATE TABLE PostBoard (
    Postboard_ID INTEGER PRIMARY KEY,
    Postboard_TimeStamp TEXT,
    Hidden_Post INTEGER CHECK(Hidden_Post IN (0,1))
);


-- UniquePostboardPost (link table between PostBoard and Post)
CREATE TABLE UniquePostboardPost (
    Postboard_ID INTEGER,
    Post_ID INTEGER,
    PRIMARY KEY (Postboard_ID, Post_ID),
    FOREIGN KEY (Postboard_ID) REFERENCES PostBoard(Postboard_ID),
    FOREIGN KEY (Post_ID) REFERENCES Post(Post_ID)
);

--Post Table
CREATE TABLE Post (
    Post_ID INTEGER PRIMARY KEY,
    Post_TimeStamp TEXT NOT NULL,
    Post_type TEXT
);


--event table (this table is attached to post)
CREATE TABLE Event (
    Event_name TEXT,
    Event_Location TEXT,
    Event_attendence INTEGER,
    Event_time TEXT,
    Event_type TEXT,
    Post_ID INTEGER UNIQUE,
    FOREIGN KEY (Post_ID) REFERENCES Post(Post_ID),
    PRIMARY KEY (Event_name, Event_time)
);

--comment Table
CREATE TABLE Comment (
    Comment_ID INTEGER PRIMARY KEY,
    Comment_TimeStamp TEXT
);


--EngagePost Table (Post-comment Link)
CREATE TABLE EngagePost (
    Post_ID INTEGER,
    Comment_ID INTEGER,
    PRIMARY KEY (Post_ID, Comment_ID),
    FOREIGN KEY (Post_ID) REFERENCES Post(Post_ID),
    FOREIGN KEY (Comment_ID) REFERENCES Comment(Comment_ID)
);

