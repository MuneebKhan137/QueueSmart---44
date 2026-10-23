// Queue Status
// A2 requirements for this screen:
//  - Current position in queue
//  - Estimated wait time
//  - Status: waiting / almost ready / served
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import UserShell from '../components/UserShell';
import { Steps } from './JoinQueue';
import { apiGet, apiPost } from '../api';

const STATUS_TEXT = {
  waiting: 'Waiting',
  'almost ready': 'Almost your turn',
  served: 'Served',
};

// how often to check place
const pollMs = 5000;

const unreachableText = "Can't reach QueueSmart right now. Make sure the server is running, then refresh.";
const messageFor = (err) => (err.status ? err.message : unreachableText);

export default function QueueStatus() {
  // { entry, serviceName, position, waitMinutes, status }
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [leaving, setLeaving] = useState(false);

  const requestCount = useRef(0);

  useEffect(() => {
    const load = async () => {
      const request = ++requestCount.current;
      try {
        const data = await apiGet('/queues/me');
        if (request !== requestCount.current) return;
        setMine(data.entry ? data : null);
        setLoadError('');
      } catch (err) {
        if (request === requestCount.current) setLoadError(messageFor(err));
      } finally {
        if (request === requestCount.current) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, pollMs);
    return () => {
      clearInterval(timer);
      requestCount.current += 1;
    };
  }, []);

  if (loading) {
    return (
      <UserShell eyebrow="My place" title="Checking your place…">
        <p className="qs-muted" role="status">Loading…</p>
      </UserShell>
    );
  }

  if (!mine) {
    return (
      <UserShell eyebrow="My place" title="You&apos;re not in a queue." subtitle="Join a service to get your token.">
        <div className="qs-card qs-pad">
          {loadError && <p className="qs-error" role="alert">{loadError}</p>}
          <Link className="qs-btn" to="/join">Join a queue</Link>
        </div>
      </UserShell>
    );
  }

  const { entry, serviceName, position, waitMinutes, status } = mine;
  const joined = new Date(entry.joinedAt);

  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    setActionError('');
    requestCount.current += 1;
    try {
      await apiPost('/queues/leave');
      setMine(null);
    } catch (err) {
      setActionError(messageFor(err));
    } finally {
      setLeaving(false);
    }
  };

  return (
    <UserShell
      eyebrow={serviceName}
      title={status === 'served' ? "You've been served." : "You're in. Take a little breather."}
      subtitle="Your place is reserved. We'll keep you updated right here."
    >
      <div className="qs-grid">
        <section className="qs-card">
          <div className="qs-banner">
            <h2>{STATUS_TEXT[status]}</h2>
            <p>Queue for <strong>{serviceName}</strong></p>
          </div>

          <div className="qs-token">
            <span>Your token number</span>
            <strong>{entry.id}</strong>
            <small>Joined at {joined.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small>
          </div>

          <div className="qs-stats">
            <div>
              <strong>{position > 0 ? position : '–'}</strong>
              <span>Your position</span>
            </div>
            <div>
              <strong>{waitMinutes}<small> min</small></strong>
              <span>Estimated wait</span>
            </div>
          </div>

          <div className="qs-pad qs-actions">
            {(actionError || loadError) && <p className="qs-error" role="alert">{actionError || loadError}</p>}
            <button type="button" className="qs-btn" onClick={leave} disabled={leaving}>
              {status === 'served' ? 'Done' : 'Leave queue'}
            </button>
          </div>
        </section>

        <Steps />
      </div>
    </UserShell>
  );
}
