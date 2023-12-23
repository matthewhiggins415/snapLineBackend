const express = require('express')
// jsonwebtoken docs: https://github.com/auth0/node-jsonwebtoken
const crypto = require('crypto')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// bcrypt docs: https://github.com/kelektiv/node.bcrypt.js
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

// see above for explanation of "salting", 10 rounds is recommended
const bcryptSaltRounds = 10
const nodemailer = require('nodemailer');


// pull in error types and the logic to handle them and set status codes
// const errors = require('../lib/custom_errors')

// const BadParamsError = errors.BadParamsError
// const BadCredentialsError = errors.BadCredentialsError

const User = require('../models/userModel')
const Image = require('../models/imageModel')
const Album = require('../models/albumModel')

// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `res.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const admin = require('firebase-admin');
const serviceAccount = require("../lib/firebaseConfig.js");
const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), 
  storageBucket: firebaseStorageBucket,
});

const router = express.Router()

// SIGN UP
router.post('/register', async (req, res, next) => {
  const { credentials } = req.body
  const { firstName, lastName, email, password, password_confirmation } = credentials

  try {
    if (!firstName || !lastName || !email || !password || password !== password_confirmation) {
      res.json({msg: "registration failed"})
    }

    const hash = await bcrypt.hash(password, bcryptSaltRounds)

    let name = firstName + " " + lastName

    const userObj = {
      firstName: firstName, 
      lastName: lastName,
      fullName: name,
      email: email,
      hashedPassword: hash
    }

    let user = await User.create(userObj)
  
    const token = crypto.randomBytes(16).toString('hex')
    user.token = token 
    await user.save()

    // send email 
    // let transporter = nodemailer.createTransport({
    //   service: 'Gmail',
    //   auth: {
    //     user: process.env.EMAIL_ADDRESS, // your Gmail address
    //     pass: process.env.EMAIL_PASS,    // your Gmail password
    //   },
    // });
    
    // let mailOptions = {
    //   from: process.env.EMAIL_ADDRESS,
    //   to: email,
    //   subject: 'Welcome to PIX Marketplace',
    //   text: `Hey there, your account has been created`
    // };

    // transporter.sendMail(mailOptions, function (error, info) {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log('Email sent: ' + info.response);
    //   }
    // });

    res.json({ user: user })
  } catch (err) {
    console.log(err)
  }
});
  

// SIGN IN
router.post('/login', async (req, res, next) => {
  try {
    const pw = req.body.credentials.password  
    // find a user based on the email that was passed
    let user = await User.findOne({ email: req.body.credentials.email })

    if (!user) {
      res.status(200).json({ msg: 'email not found' })
    } else {
      let correctPassword = await bcrypt.compare(pw, user.hashedPassword)
      if (!correctPassword) {
        res.status(200).json({ msg: 'incorrect password' })
      } else {
        const token = crypto.randomBytes(16).toString('hex')
        user.token = token
        await user.save()
        res.status(201).json({ user: user })
      }
    }
  } catch(error) {
    console.log(error)
  }
})

// CHANGE PW
router.patch('/change-password', requireToken, (req, res, next) => {
  let user
  // `req.user` will be determined by decoding the token payload
  User.findById(req.user.id)
    // save user outside the promise chain
    .then(record => { user = record })
    // check that the old password is correct
    .then(() => bcrypt.compare(req.body.passwords.old, user.hashedPassword))
    // `correctPassword` will be true if hashing the old password ends up the
    // same as `user.hashedPassword`
    .then(correctPassword => {
      // throw an error if the new password is missing, an empty string,
      // or the old password was wrong
      if (!req.body.passwords.new || !correctPassword) {
        throw new BadParamsError()
      }
    })
    // hash the new password
    .then(() => bcrypt.hash(req.body.passwords.new, bcryptSaltRounds))
    .then(hash => {
      // set and save the new hashed password in the DB
      user.hashedPassword = hash
      return user.save()
    })
    // respond with no content and status 200
    .then(() => res.sendStatus(204))
    // pass any errors along to the error handler
    .catch(next)
})

// update a single user's stripe account id 
router.patch('/user/:id/update-id', requireToken, async (req, res, next) => {
  const id = req.params.id
  let user = await User.findById(id)

  const { newStripeId } = req.body

  // needs a try catch
  user.stripeId = newStripeId
  const updatedUser = await user.save()
  res.json({ user: updatedUser })

})

// UPODATE USERS PROFILE IMAGE
router.put('/user-image-update', requireToken, async (req, res, next) => {
  let newImageUrl = req.body.data;

  let userID = req.user._id

  let user = await User.findById(userID)
  
  user.picture = newImageUrl;
  
  let updatedUser = await user.save();

  res.json({ updatedUser })
})

// LOGOUT 
router.delete('/logout', requireToken, (req, res, next) => {
  // create a new random token for the user, invalidating the current one
  req.user.token = null
  // save the token and respond with 204
  req.user.save()
    .then(() => res.sendStatus(204))
    .catch(next)
})

//GET A USER
router.get('/user/:id', async (req, res) => {
  let id = req.params.id
  let user = await User.findById(id)
  res.json({ user: user })
})

// GET ALL USERS
router.get('/users', requireToken, async (req, res, next) => {
  let users = await User.find()
  res.json({ users: users })
})

// DELETE A USER
router.delete(`/user/:id`, requireToken, async (req, res, next) => {
  let id = req.params.id;

  const photographerObjectId = new mongoose.Types.ObjectId(id);
  console.log("photographerObjectId: ", photographerObjectId);

  // remove from stripe
  // remove images from firebase

  try {
    let user = await User.findById(photographerObjectId);
    console.log("user: ", user);
  
    // removes this photographer from the subscribedTo field of any user that subbed.
    for (const subscriber of user.subscribers) {
      subStr = subscriber.toString();
      const sub = await User.findById(subStr);
      console.log("sub to remove", photographerObjectId);
      console.log("subscribed to:", sub?.subscribedTo);
      const filteredSubscribers = sub?.subscribedTo.filter(subscriber => subscriber.toString() !== id);
      console.log("filtered subscribed to:", filteredSubscribers);
      sub.subscribedTo = filteredSubscribers;
      await sub.save();
    }
  
    // removes this photographer from the subscribers field of any user they subscribed to.
    for (const subbedTo of user.subscribedTo) {
      stringId = subbedTo.toString()
      let subbedToUser = await User.findById(stringId);
      const filteredSubscribers = subbedToUser?.subscribers.filter(subscriber => subscriber.toString() !== id);
      subbedToUser.subscribers = filteredSubscribers;
      await subbedToUser.save();
      console.log("subbed to:", subbedToUser)
    }
  
  
    // if user is a photographer then delete their albums and images
    if (user.isPhotographer === true && user.albums.length > 0) {
      // remove image from firebase
      let imgArr = await Image.find({ photographer: photographerObjectId })
      console.log("imgArr", imgArr)

      const bucket = admin.storage().bucket();

      for (const img of imgArr) {
        const imagePath = `images/${img.firebaseName}`;
        await bucket.file(imagePath).delete();
      }

      const albumDeleteResult = await Album.deleteMany({ owner: user._id });
      console.log("albumDeleteResult", albumDeleteResult);
  
      let imagesDeleteResult = await Image.deleteMany({ photographer: user._id })
      console.log('imagesDeleteResult: ', imagesDeleteResult)
    }

    await User.findByIdAndDelete(photographerObjectId);

    res.json({ msg: "successfully deleted user"})

  } catch(error) {
    console.log("error", error)
  }


})

module.exports = router