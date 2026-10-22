import { NavLink } from 'react-router-dom';

// Temporary nav showing every screen. Replace with role-based nav once auth exists.
const links = [
  ['/login', 'Login'],
  ['/register', 'Register'],
  ['/dashboard', 'User Dashboard'],
  ['/join', 'Join Queue'],
  ['/status', 'Queue Status'],
  ['/history', 'History'],
  ['/admin', 'Admin Dashboard'],
  ['/admin/services', 'Service Management'],
  ['/admin/queues', 'Queue Management'],
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <strong>QueueSmart</strong>
      {links.map(([to, label]) => (
        <NavLink key={to} to={to}>{label}</NavLink>
      ))}
    </nav>
  );
}
