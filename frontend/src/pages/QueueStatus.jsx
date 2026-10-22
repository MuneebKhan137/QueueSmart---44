// Queue Status
// A2 requirements for this screen:
//  - Current position in queue
//  - Estimated wait time
//  - Status: waiting / almost ready / served
import { useState } from 'react';
import { Link } from 'react-router-dom';
import UserShell from '../components/UserShell';
import { Steps } from './JoinQueue';
import { finishEntry, getEntry, statusFor, updatePosition } from '../userQueue';

const STATUS_TEXT = {
  waiting: 'Waiting',
  'almost ready': 'Almost your turn',
  served: 'Served',
};

export default function QueueStatus() {
  const [entry, setEntry] = useState(getEntry);

  if (!entry) {
    return (
      <UserShell eyebrow="My place" title="You&apos;re not in a queue." subtitle="Join a service to get your token.">
        <div className="qs-card qs-pad">
          <Link className="qs-btn" to="/join">Join a queue</Link>
        </div>
      </UserShell>
    );
  }

  const status = statusFor(entry.position);
  const waitMinutes = Math.max(entry.position - 1, 0) * entry.durationMinutes;
  const joined = new Date(entry.joinedAt);

  // demo only: pretend the next customer was called
  const advance = () => setEntry(updatePosition(Math.max(entry.position - 1, 0)));

  const leave = () => {
    finishEntry(status === 'served' ? 'Served' : 'Left queue');
    setEntry(null);
  };

  return (
    <UserShell
      eyebrow={entry.serviceName}
      title={status === 'served' ? "You've been served." : "You're in. Take a little breather."}
      subtitle="Your place is reserved. We'll keep you updated right here."
    >
      <div className="qs-grid">
        <section className="qs-card">
          <div className="qs-banner">
            <h2>{STATUS_TEXT[status]}</h2>
            <p>Queue for <strong>{entry.serviceName}</strong></p>
          </div>

          <div className="qs-token">
            <span>Your token number</span>
            <strong>{entry.token}</strong>
            <small>Joined at {joined.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small>
          </div>

          <div className="qs-stats">
            <div>
              <strong>{entry.position > 0 ? entry.position : '–'}</strong>
              <span>Your position</span>
            </div>
            <div>
              <strong>{waitMinutes}<small> min</small></strong>
              <span>Estimated wait</span>
            </div>
          </div>

          <div className="qs-pad qs-actions">
            <button type="button" className="qs-btn qs-btn-ghost" onClick={advance} disabled={status === 'served'}>
              Simulate next customer
            </button>
            <button type="button" className="qs-btn" onClick={leave}>
              {status === 'served' ? 'Done' : 'Leave queue'}
            </button>
          </div>
        </section>

        <Steps />
      </div>
    </UserShell>
  );
}
