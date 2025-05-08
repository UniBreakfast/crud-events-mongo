const ui = {
  elements: {
    eventFormContainer: null,
    eventForm: null,
    formTitle: null,
    eventIdInput: null,
    titleInput: null,
    startdtInput: null,
    finishdtInput: null,
    descriptionInput: null,
    saveEventBtn: null,
    cancelFormBtn: null,
    showCreateEventFormBtn: null,
    eventList: null,
    calendarView: null,
    eventDisplayArea: null,
    viewModeSelect: null,
    currentViewDateDisplay: null,
    prevViewBtn: null,
    nextViewBtn: null,
    loadingIndicator: null,
    errorDisplay: null
  },

  _currentView: 'list', // 'list', 'month', 'week', 'day'
  _currentDate: new Date(), // For calendar views
  _eventsCache: [], // To hold fetched events for rendering

  init(appCallbacks) {
    this._appCallbacks = appCallbacks // { handleSaveEvent, handleDeleteEvent, handleEditRequest, refreshEvents }

    // Select DOM elements
    this.elements.eventFormContainer = document.getElementById('eventFormContainer')
    this.elements.eventForm = document.getElementById('eventForm')
    this.elements.formTitle = document.getElementById('formTitle')
    this.elements.eventIdInput = document.getElementById('eventId')
    this.elements.titleInput = document.getElementById('title')
    this.elements.startdtInput = document.getElementById('startdt')
    this.elements.finishdtInput = document.getElementById('finishdt')
    this.elements.descriptionInput = document.getElementById('description')
    this.elements.saveEventBtn = document.getElementById('saveEventBtn')
    this.elements.cancelFormBtn = document.getElementById('cancelFormBtn')
    this.elements.showCreateEventFormBtn = document.getElementById('showCreateEventFormBtn')
    this.elements.eventList = document.getElementById('eventList')
    this.elements.calendarView = document.getElementById('calendarView')
    this.elements.eventDisplayArea = document.getElementById('eventDisplayArea')
    this.elements.viewModeSelect = document.getElementById('viewMode')
    this.elements.currentViewDateDisplay = document.getElementById('currentViewDate')
    this.elements.prevViewBtn = document.getElementById('prevViewBtn')
    this.elements.nextViewBtn = document.getElementById('nextViewBtn')
    this.elements.loadingIndicator = document.getElementById('loadingIndicator')
    this.elements.errorDisplay = document.getElementById('errorDisplay')


    // Add event listeners
    this.elements.showCreateEventFormBtn.addEventListener('click', () => this.showEventForm())
    this.elements.cancelFormBtn.addEventListener('click', () => this.hideEventForm())
    this.elements.eventForm.addEventListener('submit', (e) => {
      e.preventDefault()
      this._handleFormSubmit()
    })
    this.elements.viewModeSelect.addEventListener('change', (e) => this.setView(e.target.value))
    this.elements.prevViewBtn.addEventListener('click', () => this._navigateView(-1))
    this.elements.nextViewBtn.addEventListener('click', () => this._navigateView(1))

    this.setView(this._currentView) // Initialize view
  },

  showLoading(show) {
    this.elements.loadingIndicator.style.display = show ? 'block' : 'none'
  },

  displayError(message) {
    if (message) {
      this.elements.errorDisplay.textContent = message
      this.elements.errorDisplay.style.display = 'block'
    } else {
      this.elements.errorDisplay.textContent = ''
      this.elements.errorDisplay.style.display = 'none'
    }
  },

  showEventForm(event = null) {
    this.elements.eventForm.reset()
    this.elements.eventIdInput.value = ''
    if (event) {
      this.elements.formTitle.textContent = 'Edit Event'
      this.elements.eventIdInput.value = event.id
      this.elements.titleInput.value = event.title
      // MongoDB dates are ISO strings, datetime-local needs YYYY-MM-DDTHH:mm
      this.elements.startdtInput.value = event.startdt ? new Date(event.startdt).toISOString().slice(0, 16) : ''
      this.elements.finishdtInput.value = event.finishdt ? new Date(event.finishdt).toISOString().slice(0, 16) : ''
      this.elements.descriptionInput.value = event.description || ''
    } else {
      this.elements.formTitle.textContent = 'Create Event'
    }
    this.elements.eventFormContainer.style.display = 'block'
    this.elements.titleInput.focus()
  },

  hideEventForm() {
    this.elements.eventForm.reset()
    this.elements.eventFormContainer.style.display = 'none'
  },

  _handleFormSubmit() {
    const id = this.elements.eventIdInput.value
    const eventData = {
      title: this.elements.titleInput.value,
      startdt: this.elements.startdtInput.value, // Will be ISO string in UTC if timezone not specified, or local time
      finishdt: this.elements.finishdtInput.value,
      description: this.elements.descriptionInput.value,
    }
    // Basic validation for dates
    if (new Date(eventData.finishdt) < new Date(eventData.startdt)) {
        this.displayError("Finish date cannot be before start date.")
        return
    }
    this.displayError(null) // Clear previous errors

    this._appCallbacks.handleSaveEvent(id, eventData)
  },

  renderEvents(events) {
    this._eventsCache = events.sort((a, b) => new Date(a.startdt) - new Date(b.startdt))
    this._renderCurrentView()
  },

  _renderCurrentView() {
    this.elements.eventList.style.display = 'none'
    this.elements.calendarView.style.display = 'none'
    this.elements.calendarView.innerHTML = '' // Clear previous calendar content

    this._updateViewDateDisplay()

    switch (this._currentView) {
      case 'month':
        this.elements.calendarView.style.display = 'block'
        this._renderMonthView()
        break
      case 'week':
        this.elements.calendarView.style.display = 'block'
        this._renderWeekView()
        break
      case 'day':
        this.elements.calendarView.style.display = 'block'
        this._renderDayView()
        break
      case 'list':
      default:
        this.elements.eventList.style.display = 'block'
        this._renderListView()
        break
    }
  },
  
  _formatDate(dateString, options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString(undefined, options)
  },

  _renderListView() {
    this.elements.eventList.innerHTML = '' // Clear previous list
    if (this._eventsCache.length === 0) {
      this.elements.eventList.innerHTML = '<p>No events scheduled.</p>'
      return
    }

    this._eventsCache.forEach(event => {
      const item = document.createElement('div')
      item.classList.add('event-item')
      item.dataset.id = event.id
      item.innerHTML = `
        <h3>${event.title}</h3>
        <p class="dates">
          Start: ${this._formatDate(event.startdt)}<br>
          Finish: ${this._formatDate(event.finishdt)}
        </p>
        <p>${event.description || 'No description.'}</p>
        <div class="timestamps" style="font-size: 0.75em; color: #777;">
            Created: ${this._formatDate(event.createdt, {dateStyle: 'short', timeStyle: 'short'})} | 
            Updated: ${this._formatDate(event.updatedt, {dateStyle: 'short', timeStyle: 'short'})}
        </div>
        <div class="actions">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </div>
      `
      item.querySelector('.edit-btn').addEventListener('click', () => this._appCallbacks.handleEditRequest(event.id))
      item.querySelector('.delete-btn').addEventListener('click', () => this._appCallbacks.handleDeleteEvent(event.id))
      this.elements.eventList.appendChild(item)
    })
  },

  _renderMonthView() {
    const year = this._currentDate.getFullYear()
    const month = this._currentDate.getMonth() // 0-indexed

    this.elements.calendarView.innerHTML = `<h4>Month View: ${this._currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>`
    
    const monthGrid = document.createElement('div')
    monthGrid.className = 'month-grid'

    // Days of the week header
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    daysOfWeek.forEach(day => {
        const headerCell = document.createElement('div')
        headerCell.className = 'day-header-cell'
        headerCell.textContent = day
        headerCell.style.textAlign = 'center'
        headerCell.style.fontWeight = 'bold'
        headerCell.style.padding = '5px'
        headerCell.style.backgroundColor = '#f0f0f0'
        monthGrid.appendChild(headerCell)
    })

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startDayOfWeek = firstDayOfMonth.getDay() // 0 for Sunday, 1 for Monday...

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyCell = document.createElement('div')
      emptyCell.className = 'day-cell empty'
      monthGrid.appendChild(emptyCell)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div')
      cell.className = 'day-cell'
      const dayNumber = document.createElement('div')
      dayNumber.className = 'day-number'
      dayNumber.textContent = day
      cell.appendChild(dayNumber)

      const currentDateCell = new Date(year, month, day)
      const eventsForDay = this._eventsCache.filter(event => {
        const eventStart = new Date(event.startdt)
        return eventStart.getFullYear() === year &&
               eventStart.getMonth() === month &&
               eventStart.getDate() === day
      })

      eventsForDay.forEach(event => {
        const eventSummary = document.createElement('div')
        eventSummary.className = 'event-summary'
        eventSummary.textContent = event.title
        eventSummary.title = `${event.title} (${this._formatDate(event.startdt, {hour:'2-digit', minute:'2-digit'})})`
        // Could add click listener to show event details
        cell.appendChild(eventSummary)
      })
      monthGrid.appendChild(cell)
    }
    this.elements.calendarView.appendChild(monthGrid)
  },

  _renderWeekView() {
    this.elements.calendarView.innerHTML = `<h4>Week View (Implementation Pending)</h4><p>Display events for the week of ${this._currentDate.toLocaleDateString()}.</p>`
    // Placeholder: List events for the current week
    const startOfWeek = new Date(this._currentDate)
    startOfWeek.setDate(this._currentDate.getDate() - this._currentDate.getDay()) // Assuming Sunday is start of week
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    this.elements.currentViewDateDisplay.textContent = 
        `${startOfWeek.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${endOfWeek.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}`


    const eventsThisWeek = this._eventsCache.filter(event => {
        const eventStart = new Date(event.startdt)
        return eventStart >= startOfWeek && eventStart <= endOfWeek
    })
    
    if (eventsThisWeek.length === 0) {
        this.elements.calendarView.innerHTML += '<p>No events this week.</p>'
    } else {
        const list = document.createElement('ul')
        eventsThisWeek.forEach(event => {
            const listItem = document.createElement('li')
            listItem.textContent = `${this._formatDate(event.startdt)}: ${event.title}`
            list.appendChild(listItem)
        })
        this.elements.calendarView.appendChild(list)
    }
  },

  _renderDayView() {
    this.elements.calendarView.innerHTML = `<h4>Day View: ${this._currentDate.toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</h4>`
    const year = this._currentDate.getFullYear()
    const month = this._currentDate.getMonth()
    const day = this._currentDate.getDate()

    const eventsForDay = this._eventsCache.filter(event => {
      const eventStart = new Date(event.startdt)
      return eventStart.getFullYear() === year &&
             eventStart.getMonth() === month &&
             eventStart.getDate() === day
    })

    if (eventsForDay.length === 0) {
      this.elements.calendarView.innerHTML += '<p>No events scheduled for this day.</p>'
    } else {
      const list = document.createElement('ul')
      eventsForDay.forEach(event => {
        const listItem = document.createElement('li')
        listItem.innerHTML = `<strong>${this._formatDate(event.startdt, {hour:'2-digit', minute:'2-digit'})} - ${this._formatDate(event.finishdt, {hour:'2-digit', minute:'2-digit'})}</strong>: ${event.title}`
        list.appendChild(listItem)
      })
      this.elements.calendarView.appendChild(list)
    }
  },

  setView(viewName) {
    this._currentView = viewName
    this._currentDate = new Date() // Reset date when changing view type initially
    this.elements.viewModeSelect.value = viewName // Sync dropdown
    this._renderCurrentView()
  },
  
  _updateViewDateDisplay() {
    let dateText = ''
    const optionsMonthYear = { month: 'long', year: 'numeric' }
    const optionsDayMonthYear = { day: 'numeric', month: 'long', year: 'numeric' }

    switch (this._currentView) {
        case 'month':
            dateText = this._currentDate.toLocaleString(undefined, optionsMonthYear)
            break
        case 'week':
            const startOfWeek = new Date(this._currentDate)
            startOfWeek.setDate(this._currentDate.getDate() - this._currentDate.getDay()) // Sunday
            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
            dateText = `${startOfWeek.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${endOfWeek.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}`
            break
        case 'day':
            dateText = this._currentDate.toLocaleString(undefined, optionsDayMonthYear)
            break
        case 'list':
        default:
            this.elements.currentViewDateDisplay.textContent = '' // No date for list view
            return // Exit early for list view
    }
    this.elements.currentViewDateDisplay.textContent = dateText
  },

  _navigateView(direction) { // direction is -1 for prev, 1 for next
    const currentMonth = this._currentDate.getMonth()
    const currentYear = this._currentDate.getFullYear()
    const currentDay = this._currentDate.getDate()

    switch (this._currentView) {
      case 'month':
        this._currentDate.setMonth(currentMonth + direction)
        break
      case 'week':
        this._currentDate.setDate(currentDay + (7 * direction))
        break
      case 'day':
        this._currentDate.setDate(currentDay + direction)
        break
      default: // List view, no navigation
        return
    }
    this._renderCurrentView()
  },

  // Methods for real-time updates
  addEventToList(event) {
    // More sophisticated logic might be needed if sorting or view matters
    // For now, just re-fetch and re-render for simplicity or append if in list view.
    // Or, intelligently insert into this._eventsCache and re-render
    console.log('UI: Adding event', event)
    this._appCallbacks.refreshEvents() 
  },

  updateEventInList(event) {
    console.log('UI: Updating event', event)
    this._appCallbacks.refreshEvents()
  },

  removeEventFromList(eventId) {
    console.log('UI: Removing event', eventId)
    this._appCallbacks.refreshEvents()
  }
}

export { ui }