// Import dependencies
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Load environment variables
dotenv.config();

// Setup constants
const port = process.env.PORT || 5000; // Use || instead of |
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tczfz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB and set up collections
async function run() {
  try {
    await client.connect();

    const doctorCollection = client.db('Doctor-House').collection('Doctors');
    const reviewCollection = client.db('Doctor-House').collection('Reviews');
    const serviceCollection = client.db('Doctor-House').collection('Services');
    const bookingCollection = client.db('Doctor-House').collection('Bookings');
    const userCollection = client.db('Doctor-House').collection('Users');

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Connected to MongoDB!');

    // JWT Middleware
    const verifyToken = (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];
      console.log('from verify token', token);
      if (!token) {
        return res.status(401).send({ message: 'No token provided' });
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'Token verification failed' });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Admin verification middleware

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ message: 'Forbidden access' });
      }
      next();
    };

    // JWT route
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(
        { email: user.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );
      res.send({ token });
    });

    // Users collection routes
    // Create user
    app.post('/users', async (req, res) => {
      const user = req.body;
      const existingUser = await userCollection.findOne({ email: user.email });
      if (existingUser) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Get all users
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      console.log('from user ', req.headers);
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // Get user admin status
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user.role === 'admin';
      }
      res.send({ admin });
    });

    // Make user admin
    app.patch(
      '/users/admin/:id',
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const updateDoc = { $set: { role: 'admin' } };
        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          updateDoc
        );
        res.send(result);
      }
    );

    // Delete user
    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Booking routes
    app.post('/bookings', async (req, res) => {
      const bookingInfo = req.body;
      const result = await bookingCollection.insertOne(bookingInfo);
      res.send(result);
    });

    app.get('/bookings', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send({ error: 'Email is required' });
        }
        const bookings = await bookingCollection.find({ email }).toArray();
        res.status(200).send(bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send({ error: 'Failed to fetch bookings' });
      }
    });

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const result = await bookingCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.status(result.deletedCount === 1 ? 200 : 404).send({
        message:
          result.deletedCount === 1
            ? 'Booking deleted successfully.'
            : 'Booking not found.',
      });
    });

    // Doctor routes
    app.get('/doctors', async (req, res) => {
      const doctors = await doctorCollection.find().toArray();
      res.send(doctors);
    });

    app.get('/doctors/:id', async (req, res) => {
      const id = req.params.id;
      const doctor = await doctorCollection.findOne({ _id: new ObjectId(id) });
      res.send(doctor);
    });

    // Service routes
    app.get('/services', async (req, res) => {
      const services = await serviceCollection.find().toArray();
      res.send(services);
    });

    app.get('/services/availableSlots/:id', async (req, res) => {
      const id = req.params.id;
      const service = await serviceCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(service);
    });

    // Review routes
    app.get('/reviews', async (req, res) => {
      const reviews = await reviewCollection.find().toArray();
      res.send(reviews);
    });
  } finally {
    // Ensure that the client will close when you finish/error
    // await client.close();
  }
}

// Start the MongoDB connection and server
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Doctor server is running now');
});

// Start the server
app.listen(port, () => {
  console.log(`Doctor server is running at port ${port}`);
});
