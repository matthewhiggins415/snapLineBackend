const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const router = express.Router();

const STRIPE_TEST_KEY = process.env.STRIPE_TEST_SECRET_KEY;
const stripe = require('stripe')(STRIPE_TEST_KEY);

const passport = require('passport');
const requireToken = passport.authenticate('bearer', { session: false });
const User = require('../models/userModel');
const Image = require('../models/imageModel')

// create the account
router.get('/create-account', async (req, res, next) => {
  try {
    const account = await stripe.accounts.create({
      type: 'standard',
    });

    console.log("account:", account)
  
    res.json({ account: account });
  } catch (error) {
    console.log(error)
  }
});


// get the account link
router.post('/account-link', async (req, res, next) => {
  const { id } = req.body;
  console.log("stripeId", id);

  try {
    const accountLink = await stripe.accountLinks.create({
      account: `${id}`,
      refresh_url: 'http://localhost:3000/reauth',
      return_url: 'http://localhost:3000/return',
      type: 'account_onboarding',
    });
    
    res.json({ accountLink: accountLink })
  } catch(e) {
    console.log(e);
  }
});

// get the cart of user 
router.get(`/cart`, requireToken, async (req, res, next) => {
  const { id } = req.user;

  try {
    const user = await User.findById(id);
    res.json({ cart: user.cart })
  } catch(error) {
    console.log(error)
  }
})

// add item to cart
router.patch('/cart/:itemID/add', requireToken, async (req, res, next) => {
  const { id } = req.user;
  const { itemID } = req.params;

  try {
    const user = await User.findById(id);
    let cart = user.cart;
    const image = await Image.findById(itemID);
    cart.push(image);

    let updatedUser = await user.save();

    res.json({ user: updatedUser });
  } catch(error) {
    console.log(error)
  }
})


// remove item from cart 
router.patch('/cart/:itemID/remove', requireToken, async (req, res, next) => {
  const { id } = req.user;
  const { itemID } = req.params;

  try {
    const user = await User.findById(id);
    const image = await Image.findById(itemID);

    let newCart = user.cart.filter((item) => {
      let itemIDstr = item._id.toString();
      let imageIDstr = image._id.toString();

      return itemIDstr !== imageIDstr;
    });

    user.cart = newCart;
    const updatedUser = await user.save();

    res.json({ user: updatedUser });
  } catch(error) {
    console.log(error)
  }
})

// Webhook for when user completes photographer application through stripe
const endpointSecret = "whsec_0bfb2fbf1727b4b43217432b9e9f4d2c3e5cd3e875cd40506a0cd03c957c929d";

router.post('/webhook/account-created', express.raw({type: 'application/json'}), (request, response) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

   // Handle the event
   switch (event.type) {
    case 'account.external_account.created':
      const accountExternalAccountCreated = event.data.object;

      console.log("accountExternalAccountCreated: ", accountExternalAccountCreated)
      console.log("account.external_account.created: ", account.external_account.created)

      // Then define and call a function to handle the event account.external_account.created
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});


module.exports = router;