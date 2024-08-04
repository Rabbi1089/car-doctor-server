const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.port || 5000;

//middleware

app.use(cors(
  {
    origin : ['http://localhost:5173'],
    credentials : true
  }));

app.use(express.json());
app.use(cookieParser())


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



//middleware
const logger = async(req , res , next ) => {
  console.log('called : ' , req.host , req.originalUrl)
  next();
}


const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('value of token mw', token)
  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded;
      next();
  })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     client.connect();
     const serviceCollection = client.db('carDoctor').collection('services');
     const bookCollection = client.db('carDoctor').collection('bookings');


             // auth related api
             app.post('/jwt', async (req, res) => {
              const user = req.body;
              console.log(user);
              const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
              res
              .cookie('token', token, {
                      httpOnly: true,
                      secure: false
                  })
                  .send({ success: true })
          })


      //logout
      app.post('/logout', async (req , res) => {
        const user = req.body;
        console.log('logging out ', user);
        res.clearCookie('token', {maxAge : 0} ).send({success : true})
      } )


     //service related api
     app.get('/Services' , logger, async(req, res) => {
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

    app.get('/bookings',logger, verifyToken, async (req, res ) => {
       console.log('user email', req.user.email)
       console.log('ttttt token', req.cookies.token)
       if (req.query.email !== req.user.email) {
        return res.status(403).send({ message : 'forbidden access' })
       }
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

  app.patch('/booking/:id', async(req, res) => {
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