const mongoose = require('mongoose')

async function connectToMongoDB() {
  await mongoose.connect('mongodb://localhost:27017/crudEvents')
  console.log('Connected to MongoDB')
  return mongoose
}

module.exports = connectToMongoDB
