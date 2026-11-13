async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  vehicles: (params) => request(`/vehicles?${new URLSearchParams(params)}`),
  addVehicle: (body) => request('/vehicles', { method: 'POST', body }),
  updateVehicle: (id, body) => request(`/vehicles/${id}`, { method: 'PUT', body }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  bookings: () => request('/bookings'),
  book: (body) => request('/bookings', { method: 'POST', body }),
  cancelBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
};
