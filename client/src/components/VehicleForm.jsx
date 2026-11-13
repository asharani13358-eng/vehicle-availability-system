import { useState } from 'react';

const empty = { name: '', plate: '', type: 'car', seats: 4, dailyRate: 1500, status: 'active' };

export default function VehicleForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || empty);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{initial ? 'Edit vehicle' : 'Add vehicle'}</h2>
        <label>Name<input value={form.name} onChange={set('name')} required /></label>
        <label>Plate<input value={form.plate} onChange={set('plate')} required /></label>
        <div className="row">
          <label>Type
            <select value={form.type} onChange={set('type')}>
              {['car', 'van', 'truck', 'bike'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>Status
            <select value={form.status} onChange={set('status')}>
              <option value="active">active</option>
              <option value="maintenance">maintenance</option>
            </select>
          </label>
        </div>
        <div className="row">
          <label>Seats<input type="number" min="1" value={form.seats} onChange={set('seats')} /></label>
          <label>Daily rate (₹)<input type="number" min="0" value={form.dailyRate} onChange={set('dailyRate')} /></label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}
