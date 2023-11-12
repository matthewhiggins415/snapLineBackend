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
  console.log("user: ", req.user);
  console.log("req body data: ", req.body.data.albumID);
  console.log("req body: ", req.body);
  console.log(req.user)

  const album = await Album.findById(req.body.data.albumID)

  console.log("album: ", album)

  const name = req.user.firstName + " " + req.user.lastName

  const imgObj = {
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

    console.log("updated user: ", updatedAlbum);
    console.log(newImage);

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
      createdAt: {
        $gte: twoDaysAgo,
        $lt: today,
      }, 
      purchased: false
    })
    
    const limitedImagesArr = images.slice(0, 20);
    res.json({ images: limitedImagesArr })
  } catch(error) {
    console.log(error)
  }
})

// read all images from an album
router.get(`/album/:id/images`, async (req, res, next) => {
  console.log("req.params.id: ", req.params.id)

  const album = await Album.findById(req.params.id);
  console.log("album", album)

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
  console.log("image: ", image);
  console.log("req.body: ", req.body);

  const { price, discountPrice } = req.body.data
  
  console.log("price", price)
  console.log("discountPrice", discountPrice)

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