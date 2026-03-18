const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3456;
const DATA_FILE = path.join(__dirname, 'data', 'videos.json');
const AGENTS_FILE = path.join(__dirname, 'data', 'agents.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve index.html, admin.html

// ── Helpers ──────────────────────────────────────────
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function makeId(category) {
  return `${category.slice(0,2)}-${Date.now()}`;
}

// ── GET all categories (for admin sidebar) ───────────
app.get('/api/categories', (req, res) => {
  const data = readData();
  const summary = Object.entries(data).map(([key, videos]) => ({
    key,
    count: videos.length
  }));
  res.json(summary);
});

// ── GET videos in a category ─────────────────────────
app.get('/api/videos/:category', (req, res) => {
  const data = readData();
  const videos = data[req.params.category];
  if (!videos) return res.status(404).json({ error: 'Category not found' });
  res.json(videos);
});

// ── POST add a video ──────────────────────────────────
app.post('/api/videos/:category', (req, res) => {
  const data = readData();
  const { category } = req.params;
  if (!data[category]) data[category] = [];
  const video = { id: makeId(category), ...req.body };
  data[category].push(video);
  writeData(data);
  res.status(201).json(video);
});

// ── PUT update a video ────────────────────────────────
app.put('/api/videos/:category/:id', (req, res) => {
  const data = readData();
  const { category, id } = req.params;
  const idx = data[category]?.findIndex(v => v.id === id);
  if (idx === -1 || idx === undefined) return res.status(404).json({ error: 'Video not found' });
  data[category][idx] = { ...data[category][idx], ...req.body, id };
  writeData(data);
  res.json(data[category][idx]);
});

// ── DELETE a video ────────────────────────────────────
app.delete('/api/videos/:category/:id', (req, res) => {
  const data = readData();
  const { category, id } = req.params;
  const before = data[category]?.length;
  data[category] = data[category]?.filter(v => v.id !== id);
  if (data[category]?.length === before) return res.status(404).json({ error: 'Video not found' });
  writeData(data);
  res.json({ ok: true });
});

// ── Reorder videos (drag-drop support) ───────────────
app.put('/api/videos/:category/reorder', (req, res) => {
  const data = readData();
  const { category } = req.params;
  const { ids } = req.body; // ordered array of ids
  if (!data[category]) return res.status(404).json({ error: 'Category not found' });
  const map = Object.fromEntries(data[category].map(v => [v.id, v]));
  data[category] = ids.map(id => map[id]).filter(Boolean);
  writeData(data);
  res.json({ ok: true });
});

// ── Agent helpers ─────────────────────────────────────
function readAgents() {
  return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'));
}
function writeAgents(data) {
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(data, null, 2));
}

// ── GET all agents ────────────────────────────────────
app.get('/api/agents', (req, res) => {
  res.json(readAgents());
});

// ── POST add an agent ─────────────────────────────────
app.post('/api/agents', (req, res) => {
  const agents = readAgents();
  const agent = { id: `agent-${Date.now()}`, ...req.body };
  agents.push(agent);
  writeAgents(agents);
  res.status(201).json(agent);
});

// ── PUT update an agent ───────────────────────────────
app.put('/api/agents/:id', (req, res) => {
  const agents = readAgents();
  const idx = agents.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Agent not found' });
  agents[idx] = { ...agents[idx], ...req.body, id: req.params.id };
  writeAgents(agents);
  res.json(agents[idx]);
});

// ── DELETE an agent ───────────────────────────────────
app.delete('/api/agents/:id', (req, res) => {
  const agents = readAgents();
  const before = agents.length;
  const updated = agents.filter(a => a.id !== req.params.id);
  if (updated.length === before) return res.status(404).json({ error: 'Agent not found' });
  writeAgents(updated);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n✅  AI Solutions Library running at http://localhost:${PORT}`);
  console.log(`🔧  Admin panel at http://localhost:${PORT}/admin.html\n`);
});
