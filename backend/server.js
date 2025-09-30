const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // For large image data

const DATA_PATH = path.join(__dirname, 'data.json');

// Read all data
app.get('/api/data', (req, res) => {
  if (!fs.existsSync(DATA_PATH)) return res.json({ teams: [], players: [] });
  const data = JSON.parse(fs.readFileSync(DATA_PATH));
  res.json(data);
});

// Save all data
// In server.js
app.post('/api/data', (req, res) => {
  if (!Array.isArray(req.body.players) || !Array.isArray(req.body.teams)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// Reset all data
app.post('/api/reset', (req, res) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify({ teams: [], players: [] }, null, 2));
  res.json({ success: true });
});

app.listen(4000, () => console.log('API running on http://localhost:4000'));