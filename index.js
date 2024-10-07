const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT | 5000;
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
// middleware
app.use(cors());
app.use(express.json());

const uri =
  'mongodb+srv://mdsabbirkhan1972:XmcO1EimYs7znH8i@cluster0.tczfz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const doctorCollection = client.db('Doctor-House').collection('Doctors');
    const reviewCollection = client.db('Doctor-House').collection('Reviews');
    const serviceCollection = client.db('Doctor-House').collection('Services');

    // ------------------doctor collection api start-------------
    app.get('/doctors', async (req, res) => {
      const result = await doctorCollection.find().toArray();
      res.send(result);
    });
    // ------------------doctor collection api end-------------

    // ------------------services collection api start-------------

    app.get('/services', async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
    });
    // ------------------services collection api end-------------

    // ------------------reviews collection api end-------------

    app.get('/reviews', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
    // ------------------reviews collection api end-------------

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Doctor server is Running Now');
});

app.listen(port, () => {
  console.log(`Doctor Server is Running at Port ${port}`);
});
