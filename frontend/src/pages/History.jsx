// History
// A2 requirements for this screen:
//  - List of past queues joined
//  - Date, service name, outcome
import UserShell from '../components/UserShell';
import { getHistory } from '../userQueue';

export default function History() {
  const visits = getHistory();

  return (
    <UserShell eyebrow="My visits" title="Your past visits." subtitle="Every queue you've joined, newest first.">
      <section className="qs-card qs-pad">
        {visits.length === 0 ? (
          <p className="qs-muted">No visits yet.</p>
        ) : (
          <table className="qs-table">
            <thead>
              <tr><th>Date</th><th>Service</th><th>Outcome</th></tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.id}>
                  <td>{new Date(v.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{v.serviceName}</td>
                  <td><span className={`qs-pill ${v.outcome === 'Served' ? 'ok' : ''}`}>{v.outcome}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </UserShell>
  );
}
