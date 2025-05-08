const { connect } = require('./core/connect')
const { useDB } = require('./core/db')
const { startServer } = require('./core/server')

const PORT = process.env.PORT || 3000
// For a single node instance (if it's configured as a replica set of one member):
// Or, if using a cloud provider, use their connection string.
// Ensure MongoDB is running as a replica set for Change Streams.
// e.g. for local: 'mongodb://localhost:27017/event_manager?replicaSet=rs0'
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/event_manager'


async function main() {
  const mongooseInstance = await connect(MONGO_URI)
  
  const db = useDB(mongooseInstance)
  const server = startServer(PORT, 'public')

  // API Routes
  server.handleRequest('POST', '/api/events', async (body) => {
    return db.createEvent(body)
  })

  server.handleRequest('GET', '/api/events', async () => {
    return db.getAllEvents()
  })

  server.handleRequest('GET', '/api/events/:id', async (body, params) => {
    const event = await db.getEventById(params.id)
    if (!event) {
      const error = new Error('Event not found')
      error.name = 'NotFoundError'
      throw error
    }
    return event
  })

  server.handleRequest('PUT', '/api/events/:id', async (body, params) => {
    const updatedEvent = await db.updateEvent(params.id, body)
    if (!updatedEvent) {
      const error = new Error('Event not found for update')
      error.name = 'NotFoundError'
      throw error
    }
    return updatedEvent
  })

  server.handleRequest('DELETE', '/api/events/:id', async (body, params) => {
    const deletedEvent = await db.deleteEvent(params.id)
    if (!deletedEvent) {
      const error = new Error('Event not found for deletion')
      error.name = 'NotFoundError'
      throw error
    }
    return // Implicitly undefined, signals server.js to send 204 No Content
  })

  // Setup SSE feeder for event changes
  const eventUpdateFeeder = server.getFeeder('/sse/events')

  db.startChangeStream((change) => {
    let payload = {
      operationType: change.operationType,
      documentKey: change.documentKey, // Contains { _id: ... }
      fullDocument: null,
      updateDescription: null
    }

    if (change.fullDocument) {
      payload.fullDocument = change.fullDocument.toJSON ? change.fullDocument.toJSON() : change.fullDocument
    }
    
    if (change.updateDescription) {
      payload.updateDescription = change.updateDescription
    }
    
    // For delete operations, fullDocument is null, documentKey is primary identifier
    // For insert/replace, fullDocument contains the new document
    // For update, fullDocument contains document post-update (due to 'updateLookup')
    // and updateDescription shows what changed.

    eventUpdateFeeder(payload)
  })

  console.log(`Event Manager backend running on http://localhost:${PORT}`)
  console.log('API endpoints available at /api/events')
  console.log('SSE stream for events available at /sse/events')
}

main().catch(error => {
  console.error("Fatal error during application startup:", error)
  process.exit(1)
})