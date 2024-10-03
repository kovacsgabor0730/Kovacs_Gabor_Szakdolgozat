const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@e-irattarto.hwauz.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.DB_NAME}`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const connectDB = async () => {
    try {
        console.log(uri);
        await client.connect();
        console.log('MongoDB connected');
        return client.db(process.env.DB_NAME);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Kilép a folyamattal, ha az adatbázis nem kapcsolódik
    }
};

module.exports = connectDB;
