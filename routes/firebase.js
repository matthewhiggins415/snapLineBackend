// Import the functions you need from the SDKs you need
const { initializeApp } = require('firebase/app');
const multer = require('multer');
const passport = require('passport');
const requireToken = passport.authenticate('bearer', { session: false });
const User = require('../models/userModel');
const Album = require('../models/albumModel');
const Image = require('../models/imageModel');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const router = express.Router();

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

const upload = multer();

const app = initializeApp(firebaseConfig);
const storage = getStorage(app)

router.post('/upload', requireToken, upload.array('images', 10), async (req, res) => {
  const userIdObj = new ObjectId(req.user._id);
  const userId = userIdObj.toString();
  const albumID = req.body.albumID

  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const uuid = uuidv4();
  let name = `${uuid}.jpg`
  const storageRef = ref(storage, `/images/${name}`);
  const file = req.files[0]

  try {
    // Upload the file to Firebase Storage
    await uploadBytes(storageRef, file.buffer);

    // Get the download URL for the uploaded file
    const downloadURL = await getDownloadURL(storageRef);
    res.status(201).json({ msg: 'file uploaded', downloadURL: downloadURL, firebaseName: name });
  } catch (error) {
    throw new Error('Error uploading images to Firebase Storage.');
  }
});

// Upload user image to firebase 
router.post('/user/upload-user-image', requireToken, upload.array('images', 1), async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const uuid = uuidv4();

  const promises = req.files.map(async (file, index) => {
  const storageRef = ref(storage, `/images/image${uuid}.jpg`);

    try {
      await uploadBytes(storageRef, file.buffer);

      // Get the download URL for the uploaded file
      const downloadURL = await getDownloadURL(storageRef);
      
      // give each image in firebase a uiid 
      return downloadURL;
    } catch(error) {
      console.error(error);
      res.status(500).send('Error uploading images to Firebase Storage.');
    }
  });

  try {
    const downloadURLs = await Promise.all(promises);
    res.status(200).json({ msg: 'Images uploaded successfully', downloadURLs});
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading images to Firebase Storage.');
  }
});

module.exports = router