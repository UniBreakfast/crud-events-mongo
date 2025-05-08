const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

mongoose.connect('mongodb://localhost:27017/crudEvents', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Подключено к MongoDB');

    // Открываем Change Stream для коллекции events
    const changeStream = Event.watch();

    // Подписываемся на изменения
    changeStream.on('change', (change) => {
      console.log('Произошло изменение:', change);
    });

    console.log('Слушаем изменения в коллекции events...');
  })
  .catch(err => console.error('Ошибка подключения:', err));