const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const router = express.Router();

const STRIPE_TEST_KEY = process.env.STRIPE_TEST_SECRET_KEY;
const stripe = require('stripe')(STRIPE_TEST_KEY);

// create the account
router.get('/create-account', async (req, res, next) => {
  const account = await stripe.accounts.create({
    type: 'express',
  });

  res.json({ account: account });
});


//get the account link
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

module.exports = router;