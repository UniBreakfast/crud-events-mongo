const EventEmitter = require('events')

function createEventMaster(mongoose) {
  const eventEmitter = new EventEmitter()

  const eventSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  const Event = mongoose.model('Event', eventSchema)

  // Set up change stream to emit events on changes
  const changeStream = Event.watch()
  changeStream.on('change', (change) => {
    eventEmitter.emit('change', change)
  })

  // CRUD Methods
  const eventMaster = {
    // Add a new event
    async add(eventData) {
      const newEvent = new Event(eventData)
      await newEvent.save()
      return newEvent
    },

    // Update an event by ID
    async update(eventId, updateData) {
      return await Event.findByIdAndUpdate(eventId, updateData, { new: true })
    },

    // Delete an event by ID
    async delete(eventId) {
      const result = await Event.deleteOne({ _id: eventId })
      return result.deletedCount > 0
    },

    // Expose the event emitter methods
    on: eventEmitter.on.bind(eventEmitter),
    off: eventEmitter.off.bind(eventEmitter),
    once: eventEmitter.once.bind(eventEmitter)
  }

  return eventMaster
}

module.exports = createEventMaster