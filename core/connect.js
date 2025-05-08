const mongoose = require('mongoose')

async function connect(uri) {
  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected successfully')

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
    })

    return mongoose
  } catch (error) {
    console.error('Could not connect to MongoDB:', error)
    process.exit(1)
  }
}

module.exports = { connect }