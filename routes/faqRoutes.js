const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const router = express.Router();
const passport = require('passport');
const requireToken = passport.authenticate('bearer', { session: false });
const Faq = require('../models/faqModel');

// create a new faq
router.post('/newfaq', async (req, res, next) => {
  const { question, answer } = req.body.faq
  
  const faqObj = {
    question: question,
    answer: answer
  }

  try {
    const newFaq = await Faq.create(faqObj);
    res.json(newFaq);
  } catch(error) {
    console.log(error)
    res.status(500).json({ msg: "something went wrong"})
  }
})

// read all faq
router.get('/faqs', async (req, res, next) => {
  try {
    const faqs = await Faq.find();
    res.json({ faqs: faqs});
  } catch(error) {
    console.log(error)
    res.status(500).json({ msg: "something went wrong"})
  }
})

// delete a faq


module.exports = router