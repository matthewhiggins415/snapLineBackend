const express = require('express')
// jsonwebtoken docs: https://github.com/auth0/node-jsonwebtoken
const crypto = require('crypto')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// bcrypt docs: https://github.com/kelektiv/node.bcrypt.js
const bcrypt = require('bcrypt')

// see above for explanation of "salting", 10 rounds is recommended
const bcryptSaltRounds = 10

// pull in error types and the logic to handle them and set status codes
// const errors = require('../lib/custom_errors')

// const BadParamsError = errors.BadParamsError
// const BadCredentialsError = errors.BadCredentialsError

const User = require('../models/userModel')

// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `res.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// SIGN UP
// works
router.post('/register', async (req, res, next) => {
  const { credentials } = req.body
  const { firstName, lastName, email, password, password_confirmation } = credentials

  console.log("firstName", firstName);
  console.log("lastName", lastName)

  try {
    if (!firstName || !lastName || !email || !password || password !== password_confirmation) {
      res.json({msg: "registration failed"})
    }

    const hash = await bcrypt.hash(password, bcryptSaltRounds)

    const userObj = {
      firstName: firstName, 
      lastName: lastName,
      email: email,
      hashedPassword: hash
    }

    let user = await User.create(userObj)
  
    const token = crypto.randomBytes(16).toString('hex')
    user.token = token 
    await user.save()

    res.json({ user: user })
  } catch (err) {
    console.log(err)
  }
});
  

// SIGN IN
// works 
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

//update a users shipping address 
// router.patch('/user/address/:id', requireToken, (req, res, next) => {
//   let id = req.params.id
//   let data = req.body.updatedAddress

//   User.findOneAndUpdate({_id: id}, {shippingAddress: data, shippingValid: true}, {new: true}, (err, updatedRecord) => {
//     if (err) {
//       console.log(err)
//     } else {
//       console.log(updatedRecord)
//       res.json({updatedRecord})
//     }
//   })
// })

// UPODATE USERS PROFILE IMAGE
router.put('/user-image-update', requireToken, async (req, res, next) => {
  let newImageUrl = req.body.data;
  console.log("New Image URL type: ", typeof newImageUrl);
  console.log("New Image URL: ", newImageUrl);

  let userID = req.user._id

  let user = await User.findById(userID)
  
  console.log("user found in db: ", user)

  user.picture = newImageUrl;
  
  let updatedUser = await user.save();

  console.log("UPDATED USER: ", updatedUser)

  res.json({ updatedUser })
})

// LOGOUT 
// works
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

// router.patch('/user/:id/sub_success', requireToken, async (req, res, next) => {
//   let id = req.params.id
//   let user = await User.findById(id)

//   const { sessionId } = req.body

//   if (user.subscribed === false) {
//     user.subscribed = true
//     user.sessionId = sessionId
//     const updatedUser = await user.save()
//     res.json({ user: updatedUser })
//   } else {
//     res.json({ user: user })
//   }
// })

// GET ALL USERS
router.get('/users', requireToken, async (req, res, next) => {
  let users = await User.find()
  res.json({ users: users })
})

module.exports = router