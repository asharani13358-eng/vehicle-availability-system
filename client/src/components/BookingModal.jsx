import { useState } from 'react';

export default function BookingModal({ vehicle, start, end, onBook, onClose }) {
  const [customer, setCustomer] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await onBook({ vehicleId: vehicle.id, customer, start, end });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Book {vehicle.name}</h2>
        <p className="muted">{start} → {end}</p>
        <label>Customer name<input autoFocus value={customer} onChange={(e) => setCustomer(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button type="submit">Confirm booking</button>
        </div>
      </form>
    </div>
  );
}
