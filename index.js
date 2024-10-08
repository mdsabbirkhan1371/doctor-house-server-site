const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT | 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const bookingCollection = client.db('Doctor-House').collection('Bookings');

    // booking appointment

    app.post('/bookings', async (req, res) => {
      const bookingInfo = req.body;
      const result = await bookingCollection.insertOne(bookingInfo);
      res.send(result);
    });

    // get all booking
    // Assuming you've already set up MongoDB connection and `bookingCollection`

    app.get('/bookings', async (req, res) => {
      try {
        // Extract email from query parameters
        const email = req.query.email;

        if (!email) {
          return res.status(400).send({ error: 'Email is required' });
        }

        // Find bookings based on the user's email
        const filter = { email: email };
        const result = await bookingCollection.find(filter).toArray();

        // If no bookings are found, return an empty array
        if (result.length === 0) {
          return res
            .status(200)
            .send({ message: 'No bookings found', bookings: [] });
        }

        // Return the user's bookings
        res.status(200).send(result);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send({ error: 'Failed to fetch bookings' });
      }
    });

    // delete booking

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const filter = { _id: new ObjectId(id) };
        const result = await bookingCollection.deleteOne(filter);
        if (result.deletedCount === 1) {
          res.status(200).send({ message: 'Booking deleted successfully.' });
        } else {
          res.status(404).send({ message: 'Booking not found.' });
        }
      } catch (error) {
        res.status(500).send({ message: 'An error occurred.', error });
      }
    });

    // ------------------doctor collection api start-------------
    app.get('/doctors', async (req, res) => {
      const result = await doctorCollection.find().toArray();
      res.send(result);
    });

    app.get('/doctors/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await doctorCollection.findOne(query);
      res.send(result);
    });
    // ------------------doctor collection api end-------------

    // ------------------services collection api start-------------
    // get all services
    app.get('/services', async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
    });

    app.get('/services/availableSlots/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
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
