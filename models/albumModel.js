const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const albumSchema = new Schema({
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
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  images: [{
    type: Schema.Types.ObjectId,
    ref: 'Image'
  }]
}, 
{
  timestamps: true,
})

module.exports = mongoose.model('Album', albumSchema)