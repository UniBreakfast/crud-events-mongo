const client = {
  baseUrl: '/api/events',
  sseUrl: '/sse/events',

  async _fetch(url, options = {}) {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    if (options.body && typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) // Try to parse error, fallback to empty obj
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`)
        error.status = response.status
        error.data = errorData
        throw error
      }
      if (response.status === 204) { // No Content
        return null
      }
      return response.json()
    } catch (err) {
      console.error('API request failed:', err)
      throw err // Re-throw to be caught by caller
    }
  },

  async getAllEvents() {
    return this._fetch(this.baseUrl)
  },

  async getEventById(id) {
    return this._fetch(`${this.baseUrl}/${id}`)
  },

  async createEvent(eventData) {
    return this._fetch(this.baseUrl, {
      method: 'POST',
      body: eventData,
    })
  },

  async updateEvent(id, eventData) {
    return this._fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: eventData,
    })
  },

  async deleteEvent(id) {
    return this._fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  },

  connectSSE(onMessageCallback, onErrorCallback) {
    const eventSource = new EventSource(this.sseUrl)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessageCallback(data)
      } catch (e) {
        console.error('Error parsing SSE message data:', e, event.data)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      eventSource.close() // Close on error to prevent constant retries by browser
      if (onErrorCallback) {
        onErrorCallback(error)
      }
    }
    
    console.log('Connected to SSE for real-time updates.')
    return eventSource // Allow external management if needed
  }
}

export { client }