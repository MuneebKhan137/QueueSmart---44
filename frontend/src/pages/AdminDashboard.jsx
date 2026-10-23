import { useState } from 'react';
import ServiceLoadStatus from '../components/ServiceLoadStatus';
import AdminShell from '../components/AdminShell';
import { useServices } from '../context/ServiceContext';


// Admin Dashboard
// A2 requirements for this screen:
//  - List of services
//  - Current queue lengths
//  - Quick actions (open/close queue)

export default function AdminDashboard() {
  const { services, toggleServiceOpen: toggleOpen, getQueueLength: queueLength } = useServices();
  
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const handleToggle = async id => {
    setActionError('');
    setPendingId(id);
    try {
      await toggleOpen(id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPendingId(null);
    }
  };
  
  const openCount = services.filter(s => s.isOpen).length
  const waiting = services.filter(s => s.isOpen).reduce((sum, s) => sum + queueLength(s.id), 0);

  return (
    <AdminShell
          eyebrow="Welcome back"
          title="Admin Dashboard"
          subtitle="Keep services running and queues moving."
        >
          <ServiceLoadStatus />
          {actionError && <p className="qs-error" role="alert">{actionError}</p>}
          <div className="qs-admin-stats">
            <div className="qs-card qs-pad qs-admin-stat"><span>Open services</span><strong>{openCount}</strong></div>
            <div className="qs-card qs-pad qs-admin-stat"><span>People waiting</span><strong>{waiting}</strong></div>
            <div className="qs-card qs-pad qs-admin-stat"><span>Services total</span><strong>{services.length}</strong></div>
          </div>
              
          <section className="qs-card qs-pad" aria-labelledby="admin-services-heading">
            <h2 id="admin-services-heading" className="qs-h2">Services</h2>
            {services.length === 0 ? (
              !loading && !error &&
              <p className="qs-admin-empty">No services yet. Add one in Service Management.</p>
            ) : (
              <div className="qs-admin-table-wrap" role="region" aria-label="Service overview" tabIndex={0}>
                <table className="qs-table qs-admin-service-table" aria-label="Service overview">
                  <thead>
                    <tr>
                      <th scope="col">Service</th><th scope="col">Priority</th><th scope="col">Duration</th>
                      <th scope="col">Queue</th><th scope="col">Status</th><th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(s => (
                      <tr key={s.id}>
                        <td><strong className="qs-admin-name">{s.name}</strong></td>
                        <td><span className="qs-pill">{s.priority}</span></td>
                        <td>{s.durationMinutes} min</td>
                        <td>{s.isOpen ? queueLength(s.id) : 0}</td>
                        <td><span className={`qs-pill${s.isOpen ? ' ok' : ''}`}>{s.isOpen ? 'Open' : 'Closed'}</span></td>
                        <td>
                          <button type="button" className={`qs-btn qs-btn-small${s.isOpen ? ' qs-btn-ghost' : ''}`} onClick={() => handleToggle(s.id)} disabled={pendingId !== null} aria-label={`${s.isOpen ? 'Close' : 'Open'} ${s.name}`}>
                            {s.isOpen ? 'Close' : 'Open'}
                          </button>
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
