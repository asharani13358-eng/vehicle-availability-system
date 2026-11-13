import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import VehicleForm from './components/VehicleForm.jsx';
import BookingModal from './components/BookingModal.jsx';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [tab, setTab] = useState('fleet');
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(todayStr());
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | vehicle
  const [bookingFor, setBookingFor] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = { start, end, q };
      if (type) params.type = type;
      if (onlyAvailable) params.available = 'true';
      const [v, b] = await Promise.all([api.vehicles(params), api.bookings()]);
      setVehicles(v.vehicles);
      setBookings(b);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [start, end, type, q, onlyAvailable]);

  useEffect(() => { load(); }, [load]);

  const saveVehicle = async (form) => {
    const body = { ...form, seats: Number(form.seats), dailyRate: Number(form.dailyRate) };
    if (editing && editing !== 'new') await api.updateVehicle(editing.id, body);
    else await api.addVehicle(body);
    setEditing(null);
    load();
  };

  const removeVehicle = async (v) => {
    if (!confirm(`Delete ${v.name}? Its bookings will be removed too.`)) return;
    await api.deleteVehicle(v.id);
    load();
  };

  const book = async (body) => {
    await api.book(body);
    setBookingFor(null);
    load();
  };

  const cancel = async (id) => {
    await api.cancelBooking(id);
    load();
  };

  const availableCount = vehicles.filter((v) => v.available).length;

  return (
    <div className="app">
      <header>
        <h1>🚗 Vehicle Availability</h1>
        <nav>
          <button className={tab === 'fleet' ? 'tab active' : 'tab'} onClick={() => setTab('fleet')}>Fleet</button>
          <button className={tab === 'bookings' ? 'tab active' : 'tab'} onClick={() => setTab('bookings')}>
            Bookings ({bookings.length})
          </button>
        </nav>
      </header>

      {error && <p className="error banner">{error}</p>}

      {tab === 'fleet' && (
        <>
          <section className="filters">
            <label>From<input type="date" value={start} onChange={(e) => { setStart(e.target.value); if (e.target.value > end) setEnd(e.target.value); }} /></label>
            <label>To<input type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
            <label>Type
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All</option>
                {['car', 'van', 'truck', 'bike'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Search<input placeholder="Name or plate" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} /> Available only</label>
            <button onClick={() => setEditing('new')}>+ Add vehicle</button>
          </section>

          <p className="muted">{availableCount} of {vehicles.length} vehicles available for {start} → {end}</p>

          <div className="grid">
            {vehicles.map((v) => (
              <article key={v.id} className="card">
                <div className="card-head">
                  <h3>{v.name}</h3>
                  <span className={`badge ${v.available ? 'ok' : v.status === 'maintenance' ? 'warn' : 'bad'}`}>
                    {v.available ? 'Available' : v.status === 'maintenance' ? 'Maintenance' : 'Booked'}
                  </span>
                </div>
                <p className="muted">{v.plate} · {v.type} · {v.seats} seats</p>
                <p className="rate">₹{v.dailyRate.toLocaleString()}<small>/day</small></p>
                <div className="actions">
                  <button disabled={!v.available} onClick={() => setBookingFor(v)}>Book</button>
                  <button className="ghost" onClick={() => setEditing(v)}>Edit</button>
                  <button className="ghost danger" onClick={() => removeVehicle(v)}>Delete</button>
                </div>
              </article>
            ))}
            {vehicles.length === 0 && <p className="muted">No vehicles match your filters.</p>}
          </div>
        </>
      )}

      {tab === 'bookings' && (
        <table>
          <thead><tr><th>Vehicle</th><th>Customer</th><th>From</th><th>To</th><th></th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.vehicleName}</td><td>{b.customer}</td><td>{b.start}</td><td>{b.end}</td>
                <td><button className="ghost danger" onClick={() => cancel(b.id)}>Cancel</button></td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td colSpan="5" className="muted">No bookings yet.</td></tr>}
          </tbody>
        </table>
      )}

      {editing && (
        <VehicleForm initial={editing === 'new' ? null : editing} onSave={saveVehicle} onClose={() => setEditing(null)} />
      )}
      {bookingFor && (
        <BookingModal vehicle={bookingFor} start={start} end={end} onBook={book} onClose={() => setBookingFor(null)} />
      )}
    </div>
  );
}
