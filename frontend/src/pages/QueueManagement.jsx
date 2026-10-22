import { useState } from 'react';
import AdminShell from '../components/AdminShell';
import { initialQueues } from '../data/mockData';
import { useServices } from '../context/ServiceContext';
import { useNotifications } from '../context/NotificationContext';

// Queue Management
// A2 requirements for this screen:
//  - View queue for a selected service
//  - Reorder or remove users (UI only)
//  - Serve next user (UI simulation)

export default function QueueManagement() {
  const { notifyStatusChange, notifyQueuePosition } = useNotifications();
  const { services } = useServices();
  const [selectedId, setSelectedId] = useState(1);
  const [queues, setQueues] = useState(initialQueues);

  const fullLine = queues[selectedId] || [];
  const line = fullLine.filter(p => p.status !== 'served');
  const service = services.find(s => s.id === selectedId);

  function saveLine(newLine) {
    const served = fullLine.filter(p => p.status === 'served');
    setQueues({ ...queues, [selectedId]: [...newLine, ...served]});
  }

  function removePerson(personId) {
    saveLine(line.filter(p => p.id !== personId));
  }

  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= line.length) {
      return;
    }
    const reordered = [...line];
    const temp = reordered[index];
    reordered[index] = reordered[target];
    reordered[target] = temp;
    saveLine(reordered);
    notifyQueuePosition(service ? service.name : 'this service', target + 1);
  }

  function serveNext() {
    if (line.length === 0) {
      return;
    }
    const first = line[0];
    setQueues({
      ...queues,
      [selectedId]: fullLine.map(p => p.id === first.id ? { ...p, status: 'served'} : p)
    });
    notifyStatusChange(service ? service.name : 'this service', 'served');
    if (line.length > 1) {
      notifyStatusChange(service ? service.name : 'this service', 'almost ready');
    }
  }

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
            <p className="qs-muted" aria-live="polite">{line.length} waiting for {service ? service.name : 'this service'} &middot; about {line.length * 5} min to the back of the line</p>
    
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
                    {line.map((p, index) => (
                      <tr key={p.id}>
                        <td>{index + 1}</td>
                        <td><strong className="qs-admin-name">{p.name}</strong></td>
                        <td>{p.email}</td>
                        <td>{p.joinedAt}</td>
                        <td><span className="qs-pill">{p.priority}</span></td>
                        <td><span className={`qs-pill${p.status === 'almost ready' ? ' ok' : ''}`}>{p.status}</span></td>
                        <td>
                          <div className="qs-admin-actions">
                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="qs-btn qs-btn-small qs-btn-ghost" aria-label={`Move ${p.name} up`}>&uarr;</button>
                            <button type="button" onClick={() => move(index, 1)} disabled={index === line.length - 1} className="qs-btn qs-btn-small qs-btn-ghost" aria-label={`Move ${p.name} down`}>&darr;</button>
                            <button type="button" onClick={() => removePerson(p.id)} className="qs-btn qs-btn-small qs-btn-ghost" aria-label={`Remove ${p.name} from queue`}>Remove</button>
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
