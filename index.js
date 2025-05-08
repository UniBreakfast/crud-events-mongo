const connectToMongoDB = require('./dbConnection')
const createEventMaster = require('./eventMaster')
const createServer = require('./server')

async function main() {
  // Connect to MongoDB and get the mongoose instance
  const mongoose = await connectToMongoDB()

  // Create the eventMaster instance
  const eventMaster = createEventMaster(mongoose)

  // Create and start the Express server
  const app = createServer(eventMaster)
  const PORT = 3000
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })

  // Test CRUD operations
  try {
    // Test Add
    const newEvent = await eventMaster.add({
      userId: "12345",
      title: "Test Event",
      startDate: new Date("2023-10-15T14:00:00Z"),
      endDate: new Date("2023-10-15T15:00:00Z"),
      description: "Testing add method"
    })
    console.log('Added event:', newEvent._id.toString())

    // Test Update
    const updatedEvent = await eventMaster.update(newEvent._id, { title: "Updated Test Event" })
    console.log('Updated event:', updatedEvent.title)

    // Test Delete
    const deleted = await eventMaster.delete(newEvent._id)
    console.log('Deleted event:', deleted)

    // Keep the process alive to allow server to run
    process.on('SIGINT', async () => {
      await mongoose.disconnect()
      console.log('Disconnected from MongoDB')
      process.exit(0)
    })
  } catch (err) {
    console.error('Error:', err)
    await mongoose.disconnect()
    process.exit(1)
  }
}

main()
