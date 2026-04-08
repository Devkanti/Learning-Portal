const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB Compass
connectDB();

app.use(cors());
app.use(express.json()); 
app.use('/uploads', express.static('uploads')); 

app.get('/', (req, res) => {
  res.send('MERN LMS Backend is running smoothly!');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/admin', require('./routes/admin')); // <-- ADD THIS LINE

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});