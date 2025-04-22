const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/imageRoutes');
const idCardRoutes = require('./routes/idCardRoutes');
const userRoutes = require('./routes/userRoutes');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

/**
 * Swagger API dokumentáció betöltése YAML fájlból
 */
const swaggerDocument = YAML.load(path.join(__dirname, '../api-docs.yaml'));

/**
 * Express alkalmazás létrehozása
 */
const app = express();

/**
 * JSON adatok feldolgozása a kérésekben
 */
app.use(express.json());

/**
 * CORS beállítása - lehetővé teszi a különböző forrásokból érkező kérések kezelését
 */
app.use(cors());

/**
 * Statikus fájlok kiszolgálása a public mappából
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * API végpontok regisztrálása
 */
app.use('/api/auth', authRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/id-card', idCardRoutes);
app.use('/api/user', userRoutes);

/**
 * Swagger API dokumentáció elérhetővé tétele
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;