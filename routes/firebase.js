// Import the functions you need from the SDKs you need
const { initializeApp } = require('firebase/app');
const multer = require('multer');
const passport = require('passport');
const requireToken = passport.authenticate('bearer', { session: false });

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

router.post('/upload', requireToken, upload.array('images', 5), async (req, res) => {
  console.log(req.files)
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const promises = req.files.map(async (file, index) => {
    const storageRef = ref(storage, `images/image${index + 1}.jpg`);

    try {
      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, file.buffer);

      // Get the download URL for the uploaded file
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`File ${index + 1} uploaded. Download URL: ${downloadURL}`);
    } catch (error) {
      console.error(error);
      throw new Error('Error uploading images to Firebase Storage.');
    }
  });

  try {
    await Promise.all(promises);
    res.status(200).send('Images uploaded successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading images to Firebase Storage.');
  }
});

module.exports = router