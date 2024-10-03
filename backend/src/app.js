const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(express.json());

// Route-ok
app.use('/api/auth', authRoutes);

module.exports = app;
