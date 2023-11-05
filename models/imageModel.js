const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    album: {
      type: Schema.Types.ObjectId,
      ref: 'Album'
    },
    url: {
      type: String,
      required: true
    },
    photographer: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    photographerName: {
      type: String, 
    },
    sport: {
      type: String,
      required: true
    }, 
    location: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    discountPrice: {
      type: Number, 
      required: false,
      default: 0
    },
    price: {
      type: Number, 
      required: false,
      default: 0
    },
    purchased: {
      type: Boolean, 
      default: false
    }
  }, 
  {
    timestamps: true,
  })
  
  module.exports = mongoose.model('Image', imageSchema)