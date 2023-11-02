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
    console.log(users)
    res.json({ users: users })
  } catch(error) {
    console.log(error)
  }
})

module.exports = router