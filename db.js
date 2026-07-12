const { MongoClient } = require("mongodb");

const uri = "mongodb://muthu:muthu321@ac-pif1jpn-shard-00-00.anhmzyo.mongodb.net:27017,ac-pif1jpn-shard-00-01.anhmzyo.mongodb.net:27017,ac-pif1jpn-shard-00-02.anhmzyo.mongodb.net:27017/test?ssl=true&replicaSet=atlas-l65q9w-shard-0&authSource=admin&appName=Cluster";

    const client = new MongoClient(uri);

async function connectDB() {
    await client.connect();
    console.log("✅ MongoDB Connected");
    return client.db("test"); // Change "test" to your database name
}

module.exports = connectDB;