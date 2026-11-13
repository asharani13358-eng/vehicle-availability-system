const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db, save } = require('./store');

const app = express();
app.use(cors());
app.use(express.json());

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TYPES = ['car', 'van', 'truck', 'bike'];
const STATUSES = ['active', 'maintenance'];
const today = () => new Date().toISOString().slice(0, 10);
const validRange = (s, e) => DATE.test(s) && DATE.test(e) && s <= e;
const overlaps = (b, s, e) => b.start <= e && b.end >= s; // inclusive date ranges
const isAvailable = (v, s, e) =>
  v.status === 'active' && !db.bookings.some((b) => b.vehicleId === v.id && overlaps(b, s, e));

function cleanVehicle(b = {}) {
  const errors = [];
  const name = String(b.name || '').trim();
  const plate = String(b.plate || '').trim().toUpperCase();
  const seats = Number(b.seats);
  const dailyRate = Number(b.dailyRate);
  const status = b.status || 'active';
  if (!name) errors.push('name is required');
  if (!plate) errors.push('plate is required');
  if (!TYPES.includes(b.type)) errors.push(`type must be one of: ${TYPES.join(', ')}`);
  if (!Number.isInteger(seats) || seats < 1) errors.push('seats must be a whole number >= 1');
  if (!(dailyRate >= 0)) errors.push('dailyRate must be a number >= 0');
  if (!STATUSES.includes(status)) errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  return { errors, value: { name, plate, type: b.type, seats, dailyRate, status } };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---- Vehicles ----
// GET /api/vehicles?start=YYYY-MM-DD&end=YYYY-MM-DD&type=car&available=true&q=swift
app.get('/api/vehicles', (req, res) => {
  const start = req.query.start || today();
  const end = req.query.end || start;
  if (!validRange(start, end)) return res.status(400).json({ error: 'start/end must be YYYY-MM-DD and start <= end' });

  const q = String(req.query.q || '').toLowerCase();
  let list = db.vehicles.map((v) => ({ ...v, available: isAvailable(v, start, end) }));
  if (req.query.type) list = list.filter((v) => v.type === req.query.type);
  if (req.query.available === 'true') list = list.filter((v) => v.available);
  if (q) list = list.filter((v) => v.name.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q));
  res.json({ start, end, vehicles: list });
});

app.post('/api/vehicles', (req, res) => {
  const { errors, value } = cleanVehicle(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  if (db.vehicles.some((v) => v.plate === value.plate)) return res.status(409).json({ error: 'A vehicle with this plate already exists' });
  const vehicle = { id: crypto.randomUUID(), ...value };
  db.vehicles.push(vehicle);
  save();
  res.status(201).json(vehicle);
});

app.put('/api/vehicles/:id', (req, res) => {
  const idx = db.vehicles.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Vehicle not found' });
  const { errors, value } = cleanVehicle({ ...db.vehicles[idx], ...req.body });
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  if (db.vehicles.some((v) => v.plate === value.plate && v.id !== req.params.id))
    return res.status(409).json({ error: 'A vehicle with this plate already exists' });
  db.vehicles[idx] = { id: req.params.id, ...value };
  save();
  res.json(db.vehicles[idx]);
});

app.delete('/api/vehicles/:id', (req, res) => {
  const idx = db.vehicles.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Vehicle not found' });
  db.vehicles.splice(idx, 1);
  db.bookings = db.bookings.filter((b) => b.vehicleId !== req.params.id);
  save();
  res.status(204).end();
});

// ---- Bookings ----
app.get('/api/bookings', (_req, res) => {
  const list = db.bookings
    .map((b) => ({ ...b, vehicleName: db.vehicles.find((v) => v.id === b.vehicleId)?.name || 'Unknown' }))
    .sort((a, b) => a.start.localeCompare(b.start));
  res.json(list);
});

app.post('/api/bookings', (req, res) => {
  const { vehicleId, customer, start, end } = req.body || {};
  const name = String(customer || '').trim();
  if (!name) return res.status(400).json({ error: 'customer is required' });
  if (!validRange(start, end)) return res.status(400).json({ error: 'start/end must be YYYY-MM-DD and start <= end' });
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  if (vehicle.status !== 'active') return res.status(409).json({ error: 'Vehicle is under maintenance' });
  if (!isAvailable(vehicle, start, end)) return res.status(409).json({ error: 'Vehicle is already booked for those dates' });
  const booking = { id: crypto.randomUUID(), vehicleId, customer: name, start, end };
  db.bookings.push(booking);
  save();
  res.status(201).json(booking);
});

app.delete('/api/bookings/:id', (req, res) => {
  const idx = db.bookings.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  db.bookings.splice(idx, 1);
  save();
  res.status(204).end();
});

// ---- Serve built React app in production ----
const dist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

module.exports = app;
