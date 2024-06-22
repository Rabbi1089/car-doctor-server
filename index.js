const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.port || 5000;

//middleware

app.use(cors());
app.use(express.json());

console.log('db user')
console.log(process.env.DB_USER);



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.t241ufd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     client.connect();
     const serviceCollection = client.db('carDoctor').collection('services');
     const bookCollection = client.db('carDoctor').collection('bookings');

     app.get('/Services' , async(req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/Services/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};

      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { _id: 1, title: 1, price : 1 , img : 1},
      }
      const result  = await serviceCollection.findOne(query, options);
      res.send(result);

    })

    app.get('/bookings' , async (req, res ) => {
      let query = {};
      if (req.query?.email) {
        query = {email: req.query.email}
      }
      const result = await bookCollection.find(query).toArray();
      res.send(result);
    })

  app.post('/bookings', async(req ,res) => {
    const booking = req.body;
    console.log(booking);
    const result = await bookCollection.insertOne(booking);
    res.send(result)
  });

  app.patch('/booking/:id' , async(req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) }
    const updateBooking = req.body;
    console.log(updateBooking)
    const updateDoc = {
      $set: {
        status:  updateBooking.status
      },
    };
    const result = await bookCollection.updateOne(filter , updateDoc);
    res.send(result)

  })

  app.delete('/booking/:id', async(req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await bookCollection.deleteOne(query)
    res.send(result)
  })

    // Send a ping to confirm a successful connection
     client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
     //client.close();
  }
}
run().catch(console.dir);



app.get('/' , (req , res) => {
    res.send('doctor is running')
})

app.listen(port , () => {
    console.log(`server are running on ${port}`)
})