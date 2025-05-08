function useDB(mongoose) {
  const eventSchema = new mongoose.Schema({
    startdt: { type: Date, required: true },
    finishdt: { type: Date, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true }
  }, {
    timestamps: { createdAt: 'createdt', updatedAt: 'updatedt' }
  })

  eventSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (document, returnValue) {
      returnValue.id = returnValue._id
      delete returnValue._id
    }
  })

  const Event = mongoose.model('Event', eventSchema)

  async function createEvent(eventData) {
    const event = new Event(eventData)
    return await event.save()
  }

  async function getAllEvents() {
    return await Event.find()
  }

  async function getEventById(id) {
    return await Event.findById(id)
  }

  async function updateEvent(id, updateData) {
    return await Event.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
  }

  async function deleteEvent(id) {
    return await Event.findByIdAndDelete(id)
  }

  function startChangeStream(onChangeCallback) {
    const changeStream = Event.watch([], { fullDocument: 'updateLookup' })

    changeStream.on('change', (change) => {
      onChangeCallback(change)
    })

    changeStream.on('error', (error) => {
      console.error('Error in Change Stream:', error)
      // Consider adding logic to restart the stream if it fails
    })
    
    console.log('Change stream listener started for Events collection')
    return changeStream
  }

  return {
    Event,
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    startChangeStream
  }
}

module.exports = { useDB }
