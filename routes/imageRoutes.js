const dotenv = require("dotenv");
dotenv.config();
const passport = require('passport');
const requireToken = passport.authenticate('bearer', { session: false });
const express = require('express');
const router = express.Router();
const Image = require('../models/imageModel');
const Album = require('../models/albumModel');


// create new image within an album
router.post('/newimage', requireToken, async (req, res, next) => {
  const album = await Album.findById(req.body.data.albumID)

  const name = req.user.firstName + " " + req.user.lastName

  const imgObj = {
    firebaseName: req.body.data.firebaseName,
    album: req.body.data.albumID,
    url: req.body.data.imgURL,
    photographer: req.user._id,
    photographerName: name,
    sport: album.sport,
    location: album.location,
    date:  album.date
  }

  try {
    let newImage = await Image.create(imgObj);

    const updatedAlbum = await Album.findByIdAndUpdate(imgObj.album, 
      { $push: { images: newImage._id } }, // Add the new album's ID to the user's albums array
      { new: true }
    );

    res.status(201).json({ msg: 'image created' });
  } catch(error) {
    res.status(500).json({ msg: 'Error creating image' });
  }
})

// read an individual image

// read recent images
router.get('/recent/images', async (req, res, next) => {
  try {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 6);

    let images = await Image.find({
      purchased: false
    })
    
    const limitedImagesArr = images.slice(0, 12);
    res.json({ images: limitedImagesArr })
  } catch(error) {
    console.log(error)
  }
})

// read all images from an album
router.get(`/album/:id/images`, async (req, res, next) => {
  const album = await Album.findById(req.params.id);

  let imageArr = []

  try {
    for (const image of album.images) {
      let result = await Image.findById(image._id)
      imageArr.push(result)
    }
  
    res.json({ images: imageArr });
  } catch(error) {
    console.log(error)
  }

})

// update a single image
router.put('/imageprice/:id', requireToken, async (req, res, next) => {
  const image = await Image.findById(req.params.id)

  const { price, discountPrice } = req.body.data

  try {
    if (price) {
      image.price = price
    } 
  
    if (discountPrice) {
      image.discountPrice = discountPrice
    }
  
    let newImage = await image.save();
    res.json({ newImage: newImage })
  } catch(error) {
    console.log(error)
  }
})

// delete an image from album  



module.exports = router