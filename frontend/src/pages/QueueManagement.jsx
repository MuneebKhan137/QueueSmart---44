import { useState, useEffect } from 'react';
import AdminShell from '../components/AdminShell';
import { useServices } from '../context/ServiceContext';
import { apiGet, apiPost, apiDelete } from '../api';

// Queue Management
// A2 requirements for this screen:
//  - View queue for a selected service
//  - Reorder or remove users (UI only)
//  - Serve next user (UI simulation)

const empty = { entries: [], waiting: 0, estimatedWaitMinutes: 0 };

export default function QueueManagement() {
  const { services, refreshServices } = useServices();
  const [selectedId, setSelectedId] = useState(1);
  const [queue, setQueue] = useState(empty);
  const [error, setError] = useState('');

  const line = queue.entries;
  const service = services.find(s => s.id === selectedId);

  useEffect(() => {
    apiGet(`/queues/${selectedId}/entries`)
    .then((data) => { setQueue(data); setError(''); })
    .catch((err) => { setQueue(empty); setError(err.message); });
  }, [selectedId]);

  async function run(action) {
    try {
      const data = await action();
      setQueue(data);
      setError('');
      refreshServices();
    } catch (err) {
      setError(err.message);
    }
  }

  const serveNext = () => run(() => apiPost(`/queues/${selectedId}/serve-next`));
  const removePerson = (entryId) => run (() => apiDelete(`/queues/${selectedId}/entries/${entryId}`));
  const move = (entryId, direction) =>
    run(() => apiPost(`/queues/${selectedId}/entries/${entryId}/move`, { direction }));

  return (
     <AdminShell
          title="Queue Management"
          subtitle="View waiting customers, manage their order, and serve the next person."
        >
          <section className="qs-card qs-pad" aria-labelledby="queue-heading">
            <div className="qs-admin-toolbar">
              <div className="qs-admin-selector">
                <label htmlFor="service" className="qs-label">Service</label>
                <select
                  id="service"
                  value={selectedId}
                  onChange={(e) => setSelectedId(Number(e.target.value))}
                  className="qs-select"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={serveNext} className="qs-btn" disabled={line.length === 0}>
                Serve next
              </button>
            </div>
    
            <h2 id="queue-heading" className="qs-h2">Current queue</h2>
            {error && <p className="qs-muted">Something went wrong: {error}</p>}

            <p className="qs-muted" aria-live="polite">
              {queue.waiting} waiting for {service ? service.name : 'this service'} &middot; about {queue.estimatedWaitMinutes} min to the back of the line
            </p>
    
            {line.length === 0 ? (
              <p className="qs-admin-empty">No one is waiting for this service.</p>
            ) : (
              <div className="qs-admin-table-wrap" role="region" aria-label="Waiting customers" tabIndex={0}>
                <table className="qs-table qs-admin-queue-table" aria-label="Waiting customers">
                  <thead>
                    <tr>
                      <th scope="col">#</th><th scope="col">Name</th><th scope="col">Email</th>
                      <th scope="col">Joined</th><th scope="col">Priority</th><th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                   {line.map((row, index) => (
                      <tr key={row.entry.id}>
                        <td>{row.position}</td>
                        <td><strong className="qs-admin-name">{row.entry.name}</strong></td>
                        <td>{row.entry.email}</td>
                        <td>{new Date(row.entry.joinedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</td>
                        <td><span className="qs-pill">{row.entry.priority}</span></td>
                        <td><span className={`qs-pill${row.status === 'almost ready' ? ' ok' : ''}`}>{row.status}</span></td>
                        <td>
                          <div className="qs-admin-actions">
                            <button type="button" onClick={() => move(row.entry.id, 'up')} disabled={index === 0} className="qs-btn qs-btn-small qs-btn-ghost" aria-label={`Move ${row.entry.name} up`}>&uarr;</button>
                            <button type="button" onClick={() => move(row.entry.id, 'down')} disabled={index === line.length - 1} className="qs-btn qs-btn-small qs-btn-ghost" aria-label={`Move ${row.entry.name} down`}>&darr;</button>
                            <button type="button" onClick={() => removePerson(row.entry.id)} className="qs-btn qs-btn-small qs-btn-ghost" aria-label={`Remove ${row.entry.name} from queue`}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </AdminShell>
  );
}
