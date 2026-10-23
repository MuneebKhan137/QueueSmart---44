// User Dashboard
// A2 requirements for this screen:
//  - Overview of current queue status
//  - Active services available
//  - Notifications summary
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserShell from '../components/UserShell';
import ServiceLoadStatus from '../components/ServiceLoadStatus';
import { useServices } from '../context/ServiceContext';
import { useNotifications } from '../context/NotificationContext';
import { apiGet } from '../api';

const STATUS_TEXT = { waiting: 'Waiting', 'almost ready': 'Almost your turn', served: 'Served' };

const unreachableText = "Can't reach QueueSmart right now. Make sure the server is running, then refresh.";
const messageFor = (err) => (err.status ? err.message : unreachableText);

export default function UserDashboard() {
  const { services: allServices, loading, error } = useServices();
  const services = allServices.filter((s) => s.isOpen);
  const { getNotifications, getUnreadCount } = useNotifications();
  const notes = getNotifications('user');
  const unread = getUnreadCount('user');

  const [mine, setMine] = useState(null);
  const [checkingMine, setCheckingMine] = useState(true);
  const [mineError, setMineError] = useState('');

  // { [serviceId]: { waiting, waitMinutes } }
  const [stats, setStats] = useState({});

  useEffect(() => {
    apiGet('/queues/me')
      .then((data) => setMine(data.entry ? data : null))
      .catch((err) => setMineError(messageFor(err)))
      .finally(() => setCheckingMine(false));
  }, []);

  // services refresh every few seconds
  const openIds = services.map((s) => s.id).join(',');

  useEffect(() => {
    if (!openIds) return;
    let cancelled = false;
    Promise.all(openIds.split(',').map((id) => apiGet(`/queues/${id}/summary`)))
      .then((summaries) => {
        if (cancelled) return;
        setStats(Object.fromEntries(summaries.map((s) => [s.serviceId, { waiting: s.waiting, waitMinutes: s.estimatedWaitMinutes }])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [openIds]);

  return (
    <UserShell
      eyebrow="Welcome back"
      title="Skip the line, keep your day."
      subtitle="Join a queue from anywhere and we'll tell you when it's almost your turn."
    >
      <div className="qs-grid">
        <div className="qs-stack">
          <section className="qs-card qs-pad">
            <h2 className="qs-h2">Your queue</h2>
            {checkingMine ? (
              <p className="qs-muted" role="status">Loading…</p>
            ) : mineError ? (
              <p className="qs-error" role="alert">{mineError}</p>
            ) : mine ? (
              <div className="qs-current">
                <div>
                  <strong>{mine.serviceName}</strong>
                  <span>
                    Token {mine.entry.id} · {STATUS_TEXT[mine.status]}
                    {mine.position > 0 && ` · position ${mine.position}`}
                  </span>
                </div>
                <Link className="qs-btn" to="/status">View</Link>
              </div>
            ) : (
              <p className="qs-muted">You&apos;re not in a queue right now.</p>
            )}
          </section>

          <section className="qs-card qs-pad">
            <h2 className="qs-h2">Services open today</h2>
            <ServiceLoadStatus />
            {!loading && !error && services.length === 0 && <p className="qs-muted">No services are open right now.</p>}
            <ul className="qs-list">
              {services.map((s) => {
                const { waiting = '–', waitMinutes = '–' } = stats[s.id] || {};
                return (
                  <li key={s.id}>
                    <div>
                      <strong>{s.name}</strong>
                      <span>{waiting} waiting · about {waitMinutes} min</span>
                    </div>
                    {mine ? null : <Link className="qs-btn qs-btn-small" to={`/join?service=${s.id}`}>Join</Link>}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="qs-card qs-side">
          <h2>Notifications{unread > 0 && <span className="qs-badge">{unread}</span>}</h2>
          <ul className="qs-notes">
            {notes.map((n) => (
              <li key={n.id} className={n.read ? '' : 'unread'}>
                <strong>{n.title}</strong>
                <span>{n.message}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </UserShell>
  );
}
