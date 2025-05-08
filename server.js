const express = require('express')
const path = require('path')

function createServer(eventMaster) {
  const app = express()

  // Middleware to parse JSON bodies
  app.use(express.json())

  // Serve static files from the 'public' folder
  app.use(express.static(path.join(__dirname, 'public')))

  // API Endpoints for CRUD Operations
  // Create a new event
  app.post('/api/events', async (req, res) => {
    try {
      const event = await eventMaster.add(req.body)
      res.status(201).json(event)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // Update an event by ID
  app.put('/api/events/:id', async (req, res) => {
    try {
      const event = await eventMaster.update(req.params.id, req.body)
      if (!event) return res.status(404).json({ error: 'Event not found' })
      res.json(event)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // Delete an event by ID
  app.delete('/api/events/:id', async (req, res) => {
    try {
      const deleted = await eventMaster.delete(req.params.id)
      if (!deleted) return res.status(404).json({ error: 'Event not found' })
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // SSE Endpoint for real-time updates
  app.get('/api/events/stream', (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // Send a comment to keep the connection alive
    res.write(':ok\n\n')

    // Listen for changes from eventMaster
    const onChange = (change) => {
      const data = JSON.stringify(change)
      res.write(`data: ${data}\n\n`)
    }

    eventMaster.on('change', onChange)

    // Clean up when the client disconnects
    req.on('close', () => {
      eventMaster.off('change', onChange)
      res.end()
    })
  })

  return app
}

module.exports = createServer