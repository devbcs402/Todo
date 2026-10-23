const mongoose = require('mongoose');

let isConnectedBefore = false;

// Register connection lifecycle event listeners
mongoose.connection.on('connected', () => {
  isConnectedBefore = true;
  console.log('[MongoDB] Connection established successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error event:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Lost connection to database.');
  if (isConnectedBefore) {
    console.log('[MongoDB] Mongoose will attempt to reconnect automatically.');
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected to database successfully.');
});

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/todo_crud_db';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
      maxPoolSize: 10,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error('[MongoDB] Please ensure MongoDB is running at: ' + uri);
    throw error;
  }
};

module.exports = connectDB;
