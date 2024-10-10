const express = require('express');
const cors = require('cors');
require('dotenv').config();
var jwt = require('jsonwebtoken');

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
    const userCollection = client.db('Doctor-House').collection('Users');

    // jwt implement
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log({ user });
      const token = jwt.sign(user, process.env.Access_Token_Secret, {
        expiresIn: '1h',
      });
      res.send({ token });
    });

    // middle ware  for verify token
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'forbidden access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.Access_Token_Secret, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        // for running next api
        next();
      });
    };

    // --------------users collection start----------------------
    // admin related api
    // make user admin first
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin',
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // 2nd data admin

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log('params email', email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Unauthorized access' });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    });

    // collect users data
    // get all users
    app.get('/users', verifyToken, async (req, res) => {
      // console.log('from users', req.headers);
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User is already exist', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // delete user
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // ------------user collection end -------------------------

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
