const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    url: {
      type: String,
      required: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Album'
    }
  }, 
  {
    timestamps: true,
  })
  
  module.exports = mongoose.model('Image', imageSchema)