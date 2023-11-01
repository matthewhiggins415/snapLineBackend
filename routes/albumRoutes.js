const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const router = express.Router();
const passport = require('passport');
const requireToken = passport.authenticate('bearer', { session: false });
const Album = require('../models/albumModel');
const User = require('../models/userModel');

// create a new album
router.post('/newAlbum', requireToken, async (req, res, next) => {
  const { sport, location, date } = req.body.data;
  const user = req.user

  console.log("DATE:", date)

  const inputDate = date;
  const dateObject = new Date(inputDate);
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  const formattedDate = dateObject.toLocaleDateString('en-US', options);

  console.log(formattedDate);

  albumObj = {
    sport: sport, 
    location: location, 
    date: formattedDate, 
    owner: user._id
  }

  try {
    let newAlbum = await Album.create(albumObj);

    const updatedUser = await User.findByIdAndUpdate(albumObj.owner, 
      { $push: { albums: newAlbum._id } }, // Add the new album's ID to the user's albums array
      { new: true }
    );

    console.log("updated user: ", updatedUser);

    res.status(201).json(newAlbum);
  } catch(e) {
    console.log(e)
    res.status(500).json({ msg: 'Error creating album' });
  }
})

// read a single album 
router.get('/album/:id', async (req, res, next) => {
  const id = req.params.id

  console.log("id: ", id)

  try {
    let album = await Album.findById(id)
    console.log(album)
    res.json({ album: album })
  } catch(error) {
    console.log(error)
  }
})

// read all albums 
router.get('/albums/:id', async (req, res, next) => {
  const id = req.params.id

  console.log("id: ", id)

  let albums = []

  try {
    let user = await User.findById(id)
    let albumIDs = user.albums

    console.log(user.albums)

    for (const albumID of albumIDs) {
      console.log(albumID)
      try {
        const album = await Album.findById(albumID);
        if (album) {
          albums.push(album);
        } else {
          console.log(`Album with ID ${albumID} not found.`);
        }
      } catch (error) {
        console.error(`Error finding album with ID ${albumID}:`, error);
      }
    }

    res.json({ albums: albums })
  } catch(e) {
    console.log(e)
  }
})

// update an album

// delete an album 



module.exports = router