// Join Queue
// A2 requirements for this screen:
//  - Select a service
//  - View estimated wait time
//  - Join or leave a queue
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import UserShell from '../components/UserShell';
import { initialServices } from '../data/mockData';
import { getEntry, joinQueue, queueStats } from '../userQueue';

export default function JoinQueue() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [serviceId, setServiceId] = useState(params.get('service') || '');
  const [error, setError] = useState('');
  const current = getEntry();

  const openServices = initialServices.filter((s) => s.isOpen);
  const service = openServices.find((s) => String(s.id) === serviceId);
  const stats = service && queueStats(service);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!service) {
      setError('Please choose a service to join.');
      return;
    }
    joinQueue(service);
    navigate('/status');
  };

  if (current) {
    return (
      <UserShell
        eyebrow="Join a queue"
        title="You&apos;re already in line."
        subtitle="You can hold one place at a time. Leave your current queue to join another."
      >
        <div className="qs-card qs-pad">
          <p>
            You&apos;re in the <strong>{current.serviceName}</strong> queue.
          </p>
          <Link className="qs-btn" to="/status">View my place</Link>
        </div>
      </UserShell>
    );
  }

  return (
    <UserShell
      eyebrow="Join a queue"
      title="One step. Your spot is saved."
      subtitle="Pick a service below to get your personal queue token."
    >
      <div className="qs-grid">
        <form className="qs-card" onSubmit={handleSubmit} noValidate>
          <div className="qs-pad">
            <label className="qs-label" htmlFor="service">Service</label>
            <select
              id="service"
              className="qs-select"
              value={serviceId}
              required
              aria-invalid={Boolean(error)}
              onChange={(e) => {
                setServiceId(e.target.value);
                setError('');
              }}
            >
              <option value="">Select a service…</option>
              {openServices.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {error && <p className="qs-error" role="alert">{error}</p>}

            {service && <p className="qs-desc">{service.description}</p>}
          </div>

          <div className="qs-stats">
            <div>
              <strong>{stats ? stats.waiting : '–'}</strong>
              <span>People waiting</span>
            </div>
            <div>
              <strong>{stats ? stats.waitMinutes : '–'}{stats && <small> min</small>}</strong>
              <span>Estimated wait</span>
            </div>
          </div>

          <div className="qs-pad">
            <button type="submit" className="qs-btn qs-btn-block">Join queue &amp; get my token →</button>
            <p className="qs-fine">Your spot is free. You can leave at any time.</p>
          </div>
        </form>

        <Steps />
      </div>
    </UserShell>
  );
}

export function Steps() {
  return (
    <aside className="qs-card qs-side">
      <h2>Your day doesn&apos;t have to wait.</h2>
      <p>Once you join, your token is all you need. No crowded lines, no guesswork.</p>
      <ol className="qs-steps">
        <li><b>1</b><div><strong>Save your spot</strong><span>One registration. One personal token.</span></div></li>
        <li><b>2</b><div><strong>Make time for yourself</strong><span>Watch your position, not the line.</span></div></li>
        <li><b>3</b><div><strong>Be ready when called</strong><span>Head to the desk when it&apos;s your turn.</span></div></li>
      </ol>
    </aside>
  );
}
