const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

// Az új példakód alapján frissített connection string
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/?retryWrites=true&w=majority&appName=${process.env.DB_NAME}`;

// MongoClient létrehozása a megfelelő beállításokkal
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let dbInstance = null;

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

const getCollection = async (collectionName) => {
    const db = await connectDB();
    return db.collection(collectionName);
};

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