import { useState } from 'react';
import { Link } from 'react-router-dom';
import { initialQueues } from '../data/mockData';
import { useServices } from '../context/ServiceContext';
import { useNotifications } from '../context/NotificationContext';

// Queue Management
// A2 requirements for this screen:
//  - View queue for a selected service
//  - Reorder or remove users (UI only)
//  - Serve next user (UI simulation)

export default function QueueManagement() {
  const cell = { padding: '10px 12px', borderBottom: '1px solid #e5e5e5', textAlign: 'left'};
  const head = { padding: '10px 12px', borderBottom: '1px solid #e5e5e5', textAlign: 'left',
                 fontSize: '11px', color: '#666', textTransform: 'uppercase' };
  const button = { marginRight: '6px', padding: '3px 8px', cursor: 'pointer' };
  
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
    <div>
      <h1 style={{ textAlign: 'center' }}>Queue Management</h1>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
        <Link to="/admin">Overview</Link>
        <Link to="/admin/services">Service Management</Link>
        <Link to="/admin/queues">Queue Management</Link>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="service" style={{ marginRight: '8px' }}>Service:</label>
        <select
          id="service"
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          style={{ padding: '6px' }}
        >
          {services.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button onClick={serveNext} style={{ marginLeft: '16px', padding: '6px 14px', cursor: 'pointer' }}>
          Serve next
        </button>
      </div>

      <p>{line.length} waiting for {service ? service.name: 'this service'} &middot; about {line.length * 5} min to the back of the line</p>

      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ddd' }}>
        <thead>
          <tr>
            <th style={head}>#</th><th style={head}>Name</th><th style={head}>Email</th>
            <th style={head}>Joined</th><th style={head}>Priority</th><th style={head}>Status</th>
            <th style={head}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {line.map((p, index) => (
            <tr key={p.id}>
              <td style={cell}>{index + 1}</td>
              <td style={cell}>{p.name}</td>
              <td style={cell}>{p.email}</td>
              <td style={cell}>{p.joinedAt}</td>
              <td style={cell}>{p.priority}</td>
              <td style={cell}>{p.status}</td>
              <td style={cell}>
                <button onClick={() => move(index, -1)} disabled={index === 0} style={button}>&uarr;</button>
                <button onClick={() => move(index, 1)} disabled={index === line.length - 1} style={button}>&darr;</button>
                <button onClick={() => removePerson(p.id)} style={button}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {line.length === 0 && <p>No one is waiting for this service.</p>}
    </div>
  );
}
