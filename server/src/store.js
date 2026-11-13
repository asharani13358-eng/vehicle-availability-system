// Tiny JSON-file store: no database setup needed. In tests it stays in memory.
const fs = require('fs');
const path = require('path');

const FILE =
  process.env.DB_FILE ||
  (process.env.VERCEL ? '/tmp/db.json' : path.join(__dirname, '..', 'data', 'db.json'));
const persist = process.env.NODE_ENV !== 'test';

const seedVehicles = () => [
  { id: 'v1', name: 'Toyota Innova', plate: 'PB02AB1234', type: 'car', seats: 7, dailyRate: 3200, status: 'active' },
  { id: 'v2', name: 'Maruti Swift', plate: 'PB02CD5678', type: 'car', seats: 5, dailyRate: 1800, status: 'active' },
  { id: 'v3', name: 'Tempo Traveller', plate: 'PB02EF9012', type: 'van', seats: 12, dailyRate: 5500, status: 'active' },
  { id: 'v4', name: 'Tata 407', plate: 'PB02GH3456', type: 'truck', seats: 2, dailyRate: 4200, status: 'maintenance' },
  { id: 'v5', name: 'Royal Enfield Classic', plate: 'PB02IJ7890', type: 'bike', seats: 2, dailyRate: 900, status: 'active' },
];

const db = { vehicles: [], bookings: [] };

function reset(withSeed = true) {
  db.vehicles = withSeed ? seedVehicles() : [];
  db.bookings = [];
}

function save() {
  if (!persist) return;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.warn('Could not save data:', e.message);
  }
}

function load() {
  if (persist && fs.existsSync(FILE)) {
    try {
      Object.assign(db, JSON.parse(fs.readFileSync(FILE, 'utf8')));
      return;
    } catch (e) {
      console.warn('Could not read db.json, reseeding:', e.message);
    }
  }
  reset(true);
  save();
}

load();
module.exports = { db, save, reset };
