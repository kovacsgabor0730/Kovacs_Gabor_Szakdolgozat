const express = require('express');
const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/imageRoutes');
const idCardRoutes = require('./routes/idCardRoutes');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/id-card', idCardRoutes);

module.exports = app;