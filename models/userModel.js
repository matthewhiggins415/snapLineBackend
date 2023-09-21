const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  name: {
    type: String,
    default: 'name'
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
  isPhotographer: {
    type: Boolean, 
    default: false
  }, 
  hashedPassword: {
    type: String, 
    required: true
  },
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