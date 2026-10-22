// User Dashboard
// A2 requirements for this screen:
//  - Overview of current queue status
//  - Active services available
//  - Notifications summary
import { Link } from 'react-router-dom';
import UserShell from '../components/UserShell';
import { initialNotifications, initialServices } from '../data/mockData';
import { getEntry, queueStats, statusFor } from '../userQueue';

const STATUS_TEXT = { waiting: 'Waiting', 'almost ready': 'Almost your turn', served: 'Served' };

export default function UserDashboard() {
  const entry = getEntry();
  const services = initialServices.filter((s) => s.isOpen);
  const notes = initialNotifications.filter((n) => n.audience === 'user');
  const unread = notes.filter((n) => !n.read).length;

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
            {entry ? (
              <div className="qs-current">
                <div>
                  <strong>{entry.serviceName}</strong>
                  <span>
                    Token {entry.token} · {STATUS_TEXT[statusFor(entry.position)]}
                    {entry.position > 0 && ` · position ${entry.position}`}
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
            <ul className="qs-list">
              {services.map((s) => {
                const { waiting, waitMinutes } = queueStats(s);
                return (
                  <li key={s.id}>
                    <div>
                      <strong>{s.name}</strong>
                      <span>{waiting} waiting · about {waitMinutes} min</span>
                    </div>
                    {entry ? null : <Link className="qs-btn qs-btn-small" to={`/join?service=${s.id}`}>Join</Link>}
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
