const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    // credentials: true,
    // optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iepmiic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        await client.connect();

        const usersCollection = client.db("ShopNinja").collection("user");
        const parcelsCollection = client.db("ShopNinja").collection("parcel");

        // JWT api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.send({ token });
        })



        // middleware
        const verifyToken = (req, res, next) => {
            // console.log('inside verify', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorized access!' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized access!' })
                }
                req.decoded = decoded;
                next();
            })
        }


        // Check User Role
        app.get('/users/role/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access!' })
            }


            const query = { email: email }
            const user = await usersCollection.findOne(query);

            res.send(user?.role);
        })



        // save user data at DB
        app.post('/users', async (req, res) => {
            const user = req.body;

            // insert email if User does not exist
            const query = { email: user.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exist!', insertedId: null })
            }
            const result = await usersCollection.insertOne(user);

            res.send(result);
        })

        // Get all users by Admin
        app.get('/users', verifyToken, async (req, res) => {
            const result = await usersCollection.find({ role: 'user' }).toArray();

            res.send(result);
        })

        // Get all Parcels by Admin
        app.get('/parcels', verifyToken, async (req, res) => {
            const result = await parcelsCollection.find().toArray();

            res.send(result);
        })


        app.put('/users/image/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const newImage = req.body;
            console.log(newImage);

            const updatedDoc = {
                $set: {
                    image: newImage.imageURL
                }
            }

            const result = await usersCollection.updateOne(filter, updatedDoc);

            res.send(result);
        })


        // get single USER by Email
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const result = await usersCollection.findOne(query);
            res.send(result);
        })


        // Save Bookings at DB
        app.post('/parcels', verifyToken, async (req, res) => {
            const parcel = req.body;
            // console.log(parcel);

            const result = await parcelsCollection.insertOne(parcel);
            res.send(result);
        })

        app.put('/parcels/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            // console.log(data);
            // console.log(id);

            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    deliveryManId: data.deliveryManId,
                    approxDeliveryDate: data.approxDeliveryDate,
                    status: 'On The Way'
                }
            }

            const result = await parcelsCollection.updateOne(filter, updatedDoc, { upsert: true });

            res.send(result);
        })

        // Get all data for single User
        app.get('/user/parcels/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };

            const result = await parcelsCollection.find().toArray();

            res.send(result);
        })


        // Get single data for single User
        app.get('/user/parcel/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const result = await parcelsCollection.findOne(query);

            res.send(result);
        })


        // Get all Delivery Man
        app.get('/deliveryMan', async (req, res) => {
            const result = await usersCollection.find({ role: 'deliveryMan' }).toArray();

            res.send(result);
        })


        // Get Delivery List for Individual
        app.get('/deliveryList/:email', async (req, res) => {
            // first: find out the specific deliveryman
            const email = req.params.email;
            console.log('from Delivery list : ',email);

            const query1 = { email: email };
            const deliveryMan = await usersCollection.findOne(query1);
            const deliveryManIdString = deliveryMan._id.toString();
            console.log('from Delivery list : ',deliveryManIdString);

            // second: find all assigned order to him from parcelsCollection
            const query2 = {deliveryManId : deliveryManIdString}

            const result = await parcelsCollection.find(query2).toArray();
            console.log('from Delivery list : ',result);
            res.send(result);
        })













        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('ShopNinja is On');
})

app.listen(port, () => {
    console.log(`ShopNinja is on port ${port}`);
})