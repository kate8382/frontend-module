const express = require('express');
const path = require('path');
const app = express();
const port = 3001;

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, '../')));

// Обработка всех запросов и перенаправление на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
