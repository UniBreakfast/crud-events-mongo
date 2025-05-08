import { client } from './js/client.js'
import { ui } from './js/ui.js'

const app = {
  _sseConnection: null,

  init() {
    ui.init({
      handleSaveEvent: this.handleSaveEvent.bind(this),
      handleDeleteEvent: this.handleDeleteEvent.bind(this),
      handleEditRequest: this.handleEditRequest.bind(this),
      refreshEvents: this.loadEvents.bind(this)
    })
    this.loadEvents()
    this.connectToSSE()
  },

  async loadEvents() {
    ui.showLoading(true)
    ui.displayError(null)
    try {
      const events = await client.getAllEvents()
      ui.renderEvents(events)
    } catch (error) {
      console.error('Error loading events:', error)
      ui.displayError(`Failed to load events: ${error.message}`)
    } finally {
      ui.showLoading(false)
    }
  },

  async handleSaveEvent(id, eventData) {
    ui.showLoading(true)
    ui.displayError(null)
    try {
      if (id) {
        await client.updateEvent(id, eventData)
      } else {
        await client.createEvent(eventData)
      }
      ui.hideEventForm()
      // SSE will trigger reload, but for immediate feedback can call:
      // await this.loadEvents() 
    } catch (error) {
      console.error('Error saving event:', error)
      const message = error.data && error.data.errors 
        ? Object.values(error.data.errors).map(e => e.message).join(', ')
        : error.message
      ui.displayError(`Failed to save event: ${message}`)
    } finally {
      ui.showLoading(false)
    }
  },

  async handleDeleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) {
      return
    }
    ui.showLoading(true)
    ui.displayError(null)
    try {
      await client.deleteEvent(id)
      // SSE will trigger reload
      // await this.loadEvents() 
    } catch (error) {
      console.error('Error deleting event:', error)
      ui.displayError(`Failed to delete event: ${error.message}`)
    } finally {
      ui.showLoading(false)
    }
  },

  async handleEditRequest(id) {
    ui.showLoading(true)
    ui.displayError(null)
    try {
      const event = await client.getEventById(id)
      if (event) {
        ui.showEventForm(event)
      } else {
        ui.displayError('Event not found for editing.')
      }
    } catch (error) {
      console.error('Error fetching event for edit:', error)
      ui.displayError(`Failed to fetch event: ${error.message}`)
    } finally {
      ui.showLoading(false)
    }
  },

  connectToSSE() {
    if (this._sseConnection) {
      this._sseConnection.close()
    }
    this._sseConnection = client.connectSSE(
      (data) => {
        console.log('SSE Data Received:', data)
        // Handle different change stream operation types
        // For simplicity, just reload all events on any change.
        // More sophisticated: ui.addEventToList, ui.updateEventInList, ui.removeEventFromList
        // based on data.operationType and data.documentKey / data.fullDocument
        
        // A common pattern is to re-fetch or use the data directly if it's complete
        // For now, a simple refresh is robust
        this.loadEvents() 
      },
      (error) => {
        console.error('SSE connection failed permanently for this session:', error)
        ui.displayError('Real-time updates disconnected. Please refresh the page to reconnect.')
      }
    )
  }
}

document.addEventListener('DOMContentLoaded', () => {
  app.init()
})