-- Run this if you want to create the DB manually before first launch
-- Otherwise SQLAlchemy creates tables automatically on startup

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'rag_chatbot')
BEGIN
    CREATE DATABASE rag_chatbot;
END
GO

USE rag_chatbot;
GO

-- Documents table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='documents' AND xtype='U')
CREATE TABLE documents (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    filename         NVARCHAR(255)  NOT NULL,
    original_name    NVARCHAR(255)  NOT NULL,
    file_path        NVARCHAR(500)  NOT NULL,
    file_size        BIGINT         DEFAULT 0,
    page_count       INT            DEFAULT 0,
    chroma_collection NVARCHAR(255) NOT NULL,
    uploaded_at      DATETIME2      DEFAULT GETUTCDATE(),
    status           NVARCHAR(50)   DEFAULT 'processing'
);

-- Chat sessions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chat_sessions' AND xtype='U')
CREATE TABLE chat_sessions (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    title        NVARCHAR(255)  DEFAULT 'New Chat',
    document_id  INT            NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at   DATETIME2      DEFAULT GETUTCDATE(),
    updated_at   DATETIME2      DEFAULT GETUTCDATE()
);

-- Messages table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='messages' AND xtype='U')
CREATE TABLE messages (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    session_id  INT            NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        NVARCHAR(20)   NOT NULL,
    content     NVARCHAR(MAX)  NOT NULL,
    pages_used  NVARCHAR(500)  DEFAULT '',
    created_at  DATETIME2      DEFAULT GETUTCDATE()
);
GO
