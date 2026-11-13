const request = require('supertest');
const app = require('../src/app');
const { reset } = require('../src/store');

beforeEach(() => reset(true));

describe('vehicles', () => {
  test('lists seeded vehicles with availability flag', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(200);
    expect(res.body.vehicles.length).toBe(5);
    // v4 is under maintenance -> never available
    expect(res.body.vehicles.find((v) => v.id === 'v4').available).toBe(false);
  });

  test('creates a vehicle and rejects duplicate plates / bad input', async () => {
    const body = { name: 'Mahindra Thar', plate: 'pb10zz0001', type: 'car', seats: 4, dailyRate: 2800 };
    const ok = await request(app).post('/api/vehicles').send(body);
    expect(ok.status).toBe(201);
    expect(ok.body.plate).toBe('PB10ZZ0001');
    expect((await request(app).post('/api/vehicles').send(body)).status).toBe(409);
    expect((await request(app).post('/api/vehicles').send({ name: '' })).status).toBe(400);
  });

  test('updates and deletes', async () => {
    const put = await request(app).put('/api/vehicles/v1').send({ status: 'maintenance' });
    expect(put.body.status).toBe('maintenance');
    expect((await request(app).delete('/api/vehicles/v1')).status).toBe(204);
    expect((await request(app).delete('/api/vehicles/v1')).status).toBe(404);
  });
});

describe('bookings & availability', () => {
  const book = (vehicleId, start, end) =>
    request(app).post('/api/bookings').send({ vehicleId, customer: 'Test User', start, end });

  test('booking makes vehicle unavailable for overlapping dates only', async () => {
    expect((await book('v1', '2030-01-10', '2030-01-12')).status).toBe(201);

    const overlap = await request(app).get('/api/vehicles?start=2030-01-12&end=2030-01-14');
    expect(overlap.body.vehicles.find((v) => v.id === 'v1').available).toBe(false);

    const free = await request(app).get('/api/vehicles?start=2030-01-13&end=2030-01-14');
    expect(free.body.vehicles.find((v) => v.id === 'v1').available).toBe(true);
  });

  test('rejects conflicting, maintenance, and invalid bookings', async () => {
    await book('v1', '2030-02-01', '2030-02-05');
    expect((await book('v1', '2030-02-03', '2030-02-04')).status).toBe(409);
    expect((await book('v4', '2030-02-03', '2030-02-04')).status).toBe(409);
    expect((await book('v1', '2030-02-10', '2030-02-01')).status).toBe(400);
    expect((await book('nope', '2030-02-01', '2030-02-02')).status).toBe(404);
  });

  test('cancelling a booking frees the vehicle', async () => {
    const b = await book('v2', '2030-03-01', '2030-03-02');
    expect((await request(app).delete(`/api/bookings/${b.body.id}`)).status).toBe(204);
    expect((await book('v2', '2030-03-01', '2030-03-02')).status).toBe(201);
  });

  test('available=true filter hides booked vehicles', async () => {
    await book('v1', '2030-04-01', '2030-04-01');
    const res = await request(app).get('/api/vehicles?start=2030-04-01&end=2030-04-01&available=true');
    expect(res.body.vehicles.map((v) => v.id)).not.toContain('v1');
  });
});
