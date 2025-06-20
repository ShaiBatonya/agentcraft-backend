const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json());

// Simple in-memory storage for testing
let threads = [];
let messages = [];
let threadCounter = 1;
let messageCounter = 1;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simple test server running' });
});

app.get('/api/chat/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Chat service is healthy',
    api_status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Get all threads
app.get('/api/chat/threads', (req, res) => {
  console.log('📋 Getting threads:', threads.length);
  res.json(threads);
});

// Create new thread
app.post('/api/chat/thread', (req, res) => {
  const thread = {
    _id: `thread_${threadCounter++}`,
    title: req.body.title || 'New Chat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'test_user'
  };
  
  threads.unshift(thread);
  console.log('✅ Thread created:', thread._id);
  
  res.status(201).json({
    success: true,
    _id: thread._id,
    title: thread.title,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  });
});

// Delete thread
app.delete('/api/chat/thread/:threadId', (req, res) => {
  const { threadId } = req.params;
  console.log('🗑️ Delete request for thread:', threadId);
  
  // Find thread
  const threadIndex = threads.findIndex(t => t._id === threadId);
  
  if (threadIndex === -1) {
    console.log('❌ Thread not found:', threadId);
    return res.status(404).json({
      success: false,
      error: 'Thread not found or access denied'
    });
  }
  
  // Remove thread and its messages
  threads.splice(threadIndex, 1);
  messages = messages.filter(m => m.threadId !== threadId);
  
  console.log('✅ Thread deleted successfully:', threadId);
  res.json({
    success: true,
    message: 'Thread deleted successfully'
  });
});

// Get messages for a thread
app.get('/api/chat/:threadId/messages', (req, res) => {
  const { threadId } = req.params;
  const threadMessages = messages.filter(m => m.threadId === threadId);
  console.log(`📨 Getting messages for thread ${threadId}:`, threadMessages.length);
  res.json(threadMessages);
});

// Send message to thread
app.post('/api/chat/:threadId/message', (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;
  
  console.log(`📤 Sending message to thread ${threadId}:`, content);
  
  if (!content || !content.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Message content is required'
    });
  }
  
  // Create user message
  const userMessage = {
    _id: `msg_${messageCounter++}`,
    threadId,
    role: 'user',
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  
  // Create AI response
  const aiMessage = {
    _id: `msg_${messageCounter++}`,
    threadId,
    role: 'assistant',
    content: `Echo: ${content.trim()} (This is a test response from the simple server)`,
    createdAt: new Date().toISOString(),
  };
  
  messages.push(userMessage, aiMessage);
  
  // Update thread timestamp
  const thread = threads.find(t => t._id === threadId);
  if (thread) {
    thread.updatedAt = new Date().toISOString();
  }
  
  console.log('✅ Messages saved successfully');
  
  res.json({
    success: true,
    messages: {
      userMessage,
      assistantMessage: aiMessage
    }
  });
});

// Test endpoint
app.get('/api/chat/test', (req, res) => {
  res.json({
    success: true,
    message: "Simple test server working",
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Threads: http://localhost:${PORT}/api/chat/threads`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log('');
  console.log('🧪 This is a SIMPLE TEST SERVER for development only');
  console.log('✅ No database, authentication, or external APIs required');
  console.log('📝 All data is stored in memory and will be lost on restart');
}); 