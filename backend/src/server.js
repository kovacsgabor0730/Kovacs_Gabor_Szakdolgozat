const app = require('./app');
const dotenv = require('dotenv');

/**
 * Környezeti változók betöltése a .env fájlból
 */
dotenv.config();

/**
 * A szerver port száma. Ha a PORT környezeti változó nincs beállítva, 
 * a 3000-es portot használja alapértelmezettként.
 */
const port = process.env.PORT || 3000;

/**
 * Elindítja a szervert a megadott porton és kiírja a konzolra a szerver elérhetőségét.
 */
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
