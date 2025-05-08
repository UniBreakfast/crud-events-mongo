const express = require('express')
const http = require('http')
const path = require('path')

function startServer(port, staticDir = 'public') {
  const app = express()
  app.use(express.json())

  const publicPath = path.join(__dirname, '..', staticDir)
  app.use(express.static(publicPath))

  const sseClients = {}

  const serverInstance = http.createServer(app)

  serverInstance.listen(port, () => {
    console.log(`Server listening on port ${port}`)
    console.log(`Serving static files from ${publicPath}`)
  })

  function handleRequest(method, routePath, handler) {
    app[method.toLowerCase()](routePath, async (req, res) => {
      try {
        const result = await handler(req.body, req.params, req.query)
        
        if (result === undefined) {
          return res.status(204).send()
        }
        res.status(method.toLowerCase() === 'post' ? 201 : 200).json(result)
      } catch (error) {
        if (error.name === 'NotFoundError') {
          return res.status(404).json({ message: error.message || 'Resource not found' })
        }
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
          return res.status(400).json({ message: 'Invalid ID format', details: error.message })
        }
        if (error.name === 'ValidationError') {
          return res.status(400).json({ message: 'Validation failed', errors: error.errors })
        }
        console.error(`Unhandled error for ${method} ${routePath}:`, error)
        res.status(500).json({ message: 'Internal Server Error', details: error.message })
      }
    })
  }

  function getFeeder(feedPath) {
    if (!sseClients[feedPath]) {
      sseClients[feedPath] = []
    }

    app.get(feedPath, (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders()

      sseClients[feedPath].push(res)
      console.log(`Client connected to SSE feed: ${feedPath} (${sseClients[feedPath].length} connected)`)
      
      // Optionally send a connection confirmation message
      // res.write(`data: ${JSON.stringify({ type: 'connection', status: 'established' })}\n\n`)

      req.on('close', () => {
        sseClients[feedPath] = sseClients[feedPath].filter(client => client !== res)
        console.log(`Client disconnected from SSE feed: ${feedPath} (${sseClients[feedPath].length} remaining)`)
      })
    })

    return function feedData(data) {
      if (sseClients[feedPath] && sseClients[feedPath].length > 0) {
        const jsonData = `data: ${JSON.stringify(data)}\n\n`
        sseClients[feedPath].forEach(client => {
          try {
            client.write(jsonData)
          } catch (e) {
            console.error('Error writing to SSE client, removing client:', e)
            sseClients[feedPath] = sseClients[feedPath].filter(c => c !== client)
          }
        })
      }
    }
  }

  return {
    handleRequest,
    getFeeder
  }
}

module.exports = { startServer }