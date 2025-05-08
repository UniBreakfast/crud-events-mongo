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

mongoose.connect('mongodb://localhost:27017/crudEvents', {})
  .then(async () => {
    console.log('Подключено к MongoDB');
    const newEvent = new Event({
      userId: "12345",
      title: "Встреча с клиентом",
      startDate: new Date("2023-10-15T14:00:00Z"),
      endDate: new Date("2023-10-15T15:00:00Z"),
      description: "Обсуждение проекта"
    });
    await newEvent.save();
    console.log('База данных инициализирована');
    mongoose.disconnect();
  })
  .catch(err => console.error('Ошибка:', err));
