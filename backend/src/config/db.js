const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

/**
 * Környezeti változók betöltése
 */
dotenv.config();

/**
 * MongoDB kapcsolódási URI létrehozása a környezeti változókból.
 * Tartalmazza a felhasználónevet, jelszót, hosztot és az alkalmazás nevét.
 */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/?retryWrites=true&w=majority&appName=${process.env.DB_NAME}`;

/**
 * MongoDB kliens létrehozása a megfelelő API verzió beállításokkal.
 */
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

/**
 * Az adatbázis példány
 */
let dbInstance = null;

/**
 * Csatlakozás a MongoDB adatbázishoz.
 * Ha már létezik kapcsolat, azt adja vissza.
 * 
 * @async
 * @returns {Promise<object>} Az adatbázis példány
 * @throws {Error} Hiba esetén leállítja az alkalmazást
 */
const connectDB = async () => {
    if (dbInstance) return dbInstance;
    
    try {
        console.log("Connecting to MongoDB...");
        await client.connect();
        console.log("Connected to MongoDB successfully!");
        
        // Ping parancs az ellenőrzéshez
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged deployment. Connection verified!");
        
        dbInstance = client.db(process.env.DB_NAME);
        return dbInstance;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

/**
 * Egy adott gyűjtemény (collection) lekérése az adatbázisból.
 * 
 * @async
 * @param {string} collectionName - A lekérendő gyűjtemény neve
 * @returns {Promise<object>} A kért gyűjtemény
 */
const getCollection = async (collectionName) => {
    const db = await connectDB();
    return db.collection(collectionName);
};

/**
 * MongoDB kapcsolat bezárása.
 * Felszabadítja a kapcsolatot és nullázza az adatbázis példányt.
 * 
 * @async
 * @returns {Promise<void>}
 */
const closeConnection = async () => {
    if (client) {
        await client.close();
        dbInstance = null;
        console.log("MongoDB connection closed");
    }
};

module.exports = { 
    connectDB, 
    getCollection,
    closeConnection
};