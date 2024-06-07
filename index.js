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
        const reviewsCollection = client.db("ShopNinja").collection("review");

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

        // use verifyAdmin after verifyToken
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };

            const user = await usersCollection.findOne(query);

            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'Forbidden Access!' })
            }

            next();
        }

        // use verifyUser after verifyToken
        const verifyUser = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };

            const user = await usersCollection.findOne(query);

            const isUser = user?.role === 'user';
            if (!isUser) {
                return res.status(403).send({ message: 'Forbidden Access!' })
            }

            next();
        }

        // use verifyDeliveryMan after verifyToken
        const verifyDeliveryMan = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };

            const user = await usersCollection.findOne(query);

            const isDeliveryMan = user?.role === 'deliveryMan';
            if (!isDeliveryMan) {
                return res.status(403).send({ message: 'Forbidden Access!' })
            }

            next();
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
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const page = parseInt(req.query.page);
            // Per page I will show 5 users data.
            const result = await usersCollection.find({ role: 'user' })
            .skip(page * 5)
            .limit(5)
            .toArray();

            res.send(result);
        })

        // Pagination
        app.get('/usersCount', async(req, res) =>{
            const users = await usersCollection.find({ role: 'user' }).toArray();
            const count = users.length;
      
            res.send({count});
          })

        // Get all Parcels by Admin
        app.get('/parcels', verifyToken, verifyAdmin, async (req, res) => {
            const fromDate = req.query.fromDate;
            const toDate = req.query.toDate;

            if (fromDate && toDate) {
                const result = await parcelsCollection.find({
                    deliveryDate: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                }).toArray();

                return res.send(result);
            }

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
        app.get('/user/:email', verifyToken, verifyUser, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access!' })
            }
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

        // Update Parcel Count
        app.put('/totalParcel/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const user = await usersCollection.findOne(filter);
            const totalParcel = parseInt(user?.totalParcel ? user?.totalParcel : 0);

            console.log('user = ', user);

            const updatedDoc = {
                $set: {
                    totalParcel: totalParcel + 1
                }
            }

            const result = await usersCollection.updateOne(filter, updatedDoc, { upsert: true });
            console.log('result = ', result);

            res.send(result);
        })

        // Update Bookings
        app.patch('/parcels/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const parcel = req.body;
            // console.log(parcel);
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    userName: parcel.userName,
                    email: parcel.email,
                    userPhone: parcel.userPhone,
                    parcelType: parcel.parcelType,
                    parcelWeight: parcel.parcelWeight,
                    deliveryDate: parcel.deliveryDate,
                    bookingDate: parcel.bookingDate,
                    receiverName: parcel.receiverName,
                    receiverPhone: parcel.receiverPhone,
                    deliveryAddress: parcel.deliveryAddress,
                    latitude: parcel.latitude,
                    longitude: parcel.longitude,
                    price: parcel.price,
                    status: parcel.status
                }
            }

            const result = await parcelsCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // Approve and assign Deliveryman by Admin
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

        // Canceled Booking by User and Deliveryman through Query parameter
        app.patch('/parcel/cancel/:id', async (req, res) => {
            const status = req.query.status;
            // console.log('status = ',status);
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    status: status
                }
            }

            const result = await parcelsCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // Changed role by Admin through Query parameter
        app.patch('/changeRole/:id', async (req, res) => {
            const role = req.query.role;
            // console.log('role = ',role);
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    role: role
                }
            }

            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


        // Update Delivery Count
        app.put('/deliveryCount/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const deliveryMan = await usersCollection.findOne(filter);
            const totalDelivery = parseInt(deliveryMan?.totalDelivery ? deliveryMan?.totalDelivery : 0);

            const updatedDoc = {
                $set: {
                    totalDelivery: totalDelivery + 1
                }
            }

            const result = await usersCollection.updateOne(filter, updatedDoc, { upsert: true });

            res.send(result);
        })

        // Get all Parcel for single User
        app.get('/user/parcels/:email', verifyToken, verifyUser, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access!' })
            }


            const status = req.query.status;
            if (status) {
                const query = { status: status };
                const result = await parcelsCollection.find(query).toArray();

                return res.send(result);
            }


            const query = { email: email };

            const result = await parcelsCollection.find().toArray();

            res.send(result);
        })


        // Get single data for single User
        app.get('/user/parcel/:id', verifyToken, verifyUser, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const result = await parcelsCollection.findOne(query);

            res.send(result);
        })


        // Get all Delivery Man
        app.get('/deliveryMan', verifyToken, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find({ role: 'deliveryMan' }).toArray();

            res.send(result);
        })


        // Get Delivery List for Individual
        app.get('/deliveryList/:email', verifyToken, verifyDeliveryMan, async (req, res) => {
            // first: find out the specific deliveryman
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access!' })
            }
            // console.log('from Delivery list : ',email);

            const query1 = { email: email };
            const deliveryMan = await usersCollection.findOne(query1);
            const deliveryManIdString = deliveryMan._id.toString();
            // console.log('from Delivery list : ',deliveryManIdString);

            // second: find all assigned order to him from parcelsCollection
            const query2 = { deliveryManId: deliveryManIdString }

            const result = await parcelsCollection.find(query2).toArray();
            // console.log('from Delivery list : ',result);
            res.send(result);
        })



        // Review
        app.post('/review', async (req, res) => {
            const review = req.body;

            const result = await reviewsCollection.insertOne(review);

            res.send(result);
        })

        app.get('/reviews/:email', verifyToken, verifyDeliveryMan, async (req, res) => {
            // first: find out the specific deliveryman
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access!' })
            }
            // console.log('from Delivery list : ',email);

            const query1 = { email: email };
            const deliveryMan = await usersCollection.findOne(query1);
            const deliveryManIdString = deliveryMan._id.toString();
            // console.log('from Delivery list : ',deliveryManIdString);

            // second: find all assigned order to him from parcelsCollection
            const query2 = { deliveryManId: deliveryManIdString }

            const result = await reviewsCollection.find(query2).toArray();
            // console.log('from Delivery list : ',result);
            res.send(result);
        })


        // Update Review Count
        app.put('/totalReview/:id', async (req, res) => {
            const rating = parseInt(req.query.rating);
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const deliveryMan = await usersCollection.findOne(filter);
            const totalReview = parseInt(deliveryMan?.totalReview ? deliveryMan?.totalReview : 0);
            const totalRating = parseInt(deliveryMan?.totalRating ? deliveryMan?.totalRating : 0);

            const updatedDoc = {
                $set: {
                    totalReview: totalReview + 1,
                    totalRating: totalRating + rating
                }
            }

            const result = await usersCollection.updateOne(filter, updatedDoc, { upsert: true });

            res.send(result);
        })


        // Chart
        app.get('/barChart', async (req, res) => {

            const bookings = await parcelsCollection.aggregate([
                {
                    $group: {
                        _id: '$approxDeliveryDate',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray();

            res.send(bookings);
        })


        app.get('/lineChart', async (req, res) => {

            const bookings = await parcelsCollection.aggregate([
                {
                    $group: {
                        _id: {
                            deliveryDate: '$deliveryDate',
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.deliveryDate': 1 }
                }
            ]).toArray();

            res.send(bookings);
        })

        // Stat for Home Page
        app.get('/stat', async(req, res) =>{
            const parcel = await parcelsCollection.estimatedDocumentCount();
            const user = await usersCollection.estimatedDocumentCount();
            const delivery = await parcelsCollection.find({ status: 'Delivered' }).toArray();
            const delivered = delivery.length;

            res.send({parcel, user, delivered});
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