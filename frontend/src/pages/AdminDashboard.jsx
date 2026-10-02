import { Link } from 'react-router-dom';
import { useServices } from '../context/ServiceContext';


// Admin Dashboard
// A2 requirements for this screen:
//  - List of services
//  - Current queue lengths
//  - Quick actions (open/close queue)

export default function AdminDashboard() {
  const card = { border: '5px solid #106cdb', borderRadius: '15px', padding: '15px', flex: 1 };
  const cell = { padding: '10px 12px', borderBottom: '1px solid #e5e5e5', textAlign: 'left' };
  const head = { ...cell, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' };

  const { services, toggleServiceOpen: toggleOpen, getQueueLength: queueLength } = useServices();

  const openCount = services.filter(s => s.isOpen).length;
  const waiting = services.filter(s => s.isOpen).reduce((sum, s) => sum + queueLength(s.id), 0);

  return (
    <div>
      <h1 style = {{textAlign: 'center'}}> Admin Dashboard </h1>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
        <Link to="/admin">Overview</Link>
        <Link to="/admin/services">Service Management</Link>
        <Link to="/admin/queues">Queue Management</Link>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={card}><div style={{ fontSize: '20px', color: '#666' }}>Open services</div><div style={{ fontSize: '28px' }}>{openCount}</div></div>
        <div style={card}><div style={{ fontSize: '20px', color: '#666' }}>People waiting</div><div style={{ fontSize: '28px' }}>{waiting}</div></div>
        <div style={card}><div style={{ fontSize: '20px', color: '#666' }}>Services total</div><div style={{ fontSize: '28px' }}>{services.length}</div></div>
      </div>

      <h3> Services </h3>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ddd' }}>
        <thead>
          <tr>
            <th style={head}>Service</th><th style={head}>Priority</th><th style={head}>Duration</th>
            <th style={head}>Queue</th><th style={head}>Status</th><th style={head}>Action</th>
          </tr>
        </thead>
        <tbody>
          {services.map(s => (
            <tr key={s.id}>
              <td style={cell}>{s.name}</td>
              <td style={cell}>{s.priority}</td>
              <td style={cell}>{s.durationMinutes} min</td>
              <td style={cell}>{s.isOpen ? queueLength(s.id) : 0}</td>
              <td style={cell}>{s.isOpen ? 'Open' : 'Closed'}</td>
              <td style={cell}>
                <button onClick={() => toggleOpen(s.id)}>{s.isOpen ? 'Close' : 'Open'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
