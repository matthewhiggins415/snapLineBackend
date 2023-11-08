const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  fullName: {
    type: String
  },
  picture: {
    type: String, 
    default: '',
    required: false
  },
  email: {
    type: String, 
    required: true, 
    unique: true
  },
  googleId: {
    type: String
  },
  isAdmin: {
    type: Boolean, 
    default: false
  }, 
  stripeId: {
    type: String, 
    required: false
  },
  isPhotographer: {
    type: Boolean, 
    default: false
  }, 
  hashedPassword: {
    type: String, 
    required: true
  },
  albums: [{
    type: Schema.Types.ObjectId,
    ref: 'Album'
  }],
  cart: [{}],
  token: String,
}, {
  timestamps: true, 
  toJSON: {
    // remove `hashedPassword` field when we call `.toJSON`
    transform: (_doc, user) => {
      delete user.hashedPassword
      return user
    }
  }
})

module.exports = mongoose.model('User', userSchema)