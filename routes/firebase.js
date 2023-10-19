// Import the functions you need from the SDKs you need
const { initializeApp } = require('firebase/app');
const multer = require('multer');
const passport = require('passport');
const requireToken = passport.authenticate('bearer', { session: false });
const User = require('../models/userModel')
const { ObjectId } = require('mongodb');

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkoK_e-sYQ_iByA8d5vvdlBHULwLrPLvk",
  authDomain: "snapline-33f1c.firebaseapp.com",
  projectId: "snapline-33f1c",
  storageBucket: "snapline-33f1c.appspot.com",
  messagingSenderId: "1064962047160",
  appId: "1:1064962047160:web:d282f47a3c7d5e135ac84d",
  measurementId: "G-T8TQ2P89E1"
};

const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const router = express.Router();

const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

const upload = multer();

const app = initializeApp(firebaseConfig);
const storage = getStorage(app)

router.post('/upload', requireToken, upload.array('images', 10), async (req, res) => {
  console.log(req.files)
  console.log(req.user._id)
  console.log(req.body.location)
  console.log(req.body.price)
  console.log(req.body.date)

  const userIdObj = new ObjectId(req.user._id);
  const userId = userIdObj.toString();
  console.log(userId)

  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const promises = req.files.map(async (file, index) => {
  const storageRef = ref(storage, `/images/image${index + 1}.jpg`);

    try {
      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, file.buffer);

      // Get the download URL for the uploaded file
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log(`File ${index + 1} uploaded. Download URL: ${downloadURL}`);

      // find the user 
      // create album 
      // add image to album 
      // give each image in firebase a uiid 

      return downloadURL;
    } catch (error) {
      console.error(error);
      throw new Error('Error uploading images to Firebase Storage.');
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

// Upload user image to firebase 
router.post('/user/upload-user-image', requireToken, upload.array('images', 1), async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const promises = req.files.map(async (file, index) => {
  const storageRef = ref(storage, `/images/image${index + 1}.jpg`);

    try {
      await uploadBytes(storageRef, file.buffer);

      // Get the download URL for the uploaded file
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log(`File ${index + 1} uploaded. Download URL: ${downloadURL}`);
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