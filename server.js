const express = require('express');
const mongoose = require('mongoose');
const color = require('colors');
const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const cors = require('cors');
const auth = require('./lib/auth.js');
const bodyParser = require('body-parser');

// routes 
const userRoutes = require('./routes/userRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const firebaseRoutes = require('./routes/firebase');
const albumRoutes = require('./routes/albumRoutes.js');
const imageRoutes = require('./routes/imageRoutes.js');
const photographerRoutes = require('./routes/photographerRoutes.js');
const faqRoutes = require('./routes/faqRoutes.js');

// connect to db
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(`mongodb+srv://${process.env.MONGO_URI_USERNAME}:${process.env.MONGO_URI_PW}@snapline.20yggtd.mongodb.net/`, {
      useNewUrlParser: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch(error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
}
  
connectDB();

const app = express();

app.use(cors({ origin: ['https://pixmarketplace.com', 'http://localhost:8080'] }))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.json({ message: `here's process.env.NODE_ENV: ${process.env.NODE_ENV}` });
})

app.use(auth);
app.use(userRoutes);
app.use(stripeRoutes);
app.use(firebaseRoutes);
app.use(albumRoutes);
app.use(imageRoutes);
app.use(photographerRoutes);
app.use(faqRoutes);

const port = process.env.PORT || 5000

app.listen(port, console.log(`server running in ${process.env.NODE_ENV} mode on port ${port}`.blue.bold))
