const dotenv = require("dotenv");
dotenv.config();
const passport = require('passport');
const requireToken = passport.authenticate('bearer', { session: false });
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

// get a photographer 
router.get('/photographer/:id', async (req, res, next) => {
  const id = req.params.id 

  try {
    const user = await User.findById(id)
    res.json({ user: user })
  } catch(error) {
    console.log(error)
    res.json({msg: "something went wrong"})
  }
})

// get featured photographers
router.get(`/featuredPhotographers`, async (req, res, next) => {
  try {
    const users = await User.find({ isPhotographer: true })
    res.json({ users: users })
  } catch(error) {
    console.log(error)
  }
})

// search for photographers
router.post(`/photographers/search`, async (req, res, next) => {
  let value = req.body.searchValue

  try {
    let photographers = await User.find({ isPhotographer: true, fullName:{ $regex: new RegExp(`^${value}`, 'i') } })
    const limitedArr = photographers.slice(0, 10);
    res.json({ users: limitedArr })
  } catch(err) {
    console.log(error)
  }
})

// handle users subscription to photographer
router.patch(`/photographer/:id/subscribe`, requireToken, async (req, res, next) => {
  let user = req.user;
  const { id } = req.params; 

  try {
    let photographer = await User.findById(id);

    // add user to photographers subscribers
    user.subscribedTo.push(photographer);
    let updatedUser = await user.save();

    // add photographer to users subscribedTo
    photographer.subscribers.push(user);
    let updatedPhotographer = await photographer.save();

    res.json({ user: updatedUser });
  } catch (error) {
    console.log(error)
  }
});


// handle users unsubscribe to photographer
router.delete(`/photographer/:id/unsubscribe`, requireToken, async (req, res, next) => {
  let user = req.user;
  const { id } = req.params; 

  try {
    let photographer = await User.findById(id);

    // remove user from photographers subscribers
    const newArray = photographer.subscribers.filter(item => item.toString() !== user._id.toString());
    photographer.subscribers = newArray;
    await photographer.save();

    // remove photographer from users subscribedTo
    const updatedArr = user.subscribedTo.filter((item => item.toString() !== id.toString()));
    user.subscribedTo = updatedArr
    let updatedUser = await user.save()

    res.json({ user: updatedUser })
    
  } catch (error) {
    console.log(error)
  }
})

// get a users subscribed photographers
router.get(`/photographers/subscribed`, requireToken, async (req, res, next) => {
  const user = req.user

  try {
    let photographerArr = [];
  
    for (const id of user.subscribedTo) {
      const photographer = await User.findById(id);
      photographerArr.push(photographer)
    }
  
    res.json({ photographers: photographerArr })
  } catch(error) {
    console.log(error)
  }
})

module.exports = router