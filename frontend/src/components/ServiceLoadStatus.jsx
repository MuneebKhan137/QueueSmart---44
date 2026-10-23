import { useServices } from '../context/ServiceContext';

export default function ServiceLoadStatus() {
  const { loading, error, refreshServices } = useServices();
  if (error) {
    return (
      <div role="alert" className="qs-card qs-pad">
        <p className="qs-error">Unable to load services: {error}</p>
        <button type="button" className="qs-btn qs-btn-small" onClick={refreshServices}>Retry</button>
      </div>
    );
  }
  return loading ? <p className="qs-muted" role="status">Loading services…</p> : null;
}