async function request(token, path, options) {
  const deadline = AbortSignal.timeout(20_000);
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications${path}`, {
    ...options,
    signal: options.signal ? AbortSignal.any([options.signal, deadline]) : deadline,
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Unable to update notifications. Try again.');
  if (response.status !== 204) return response.json();
}

export const notificationService = {
  list: (token, signal) => request(token, '', { signal }),
  markRead: (token, id) => request(token, `/read-through/${id}`, { method: 'PUT' }),
};
