import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <nav style={{ borderBottom: '1px solid #e4e4e7', background: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#18181b', letterSpacing: '-0.02em' }}>
            Convert<span style={{ color: '#2563eb' }}>Kit</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none', fontSize: '0.875rem', color: '#71717a', fontWeight: 500 }}>Tools</Link>
          <a href="https://github.com/Ewan-Gerber" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', fontSize: '0.875rem', color: '#71717a', fontWeight: 500 }}>GitHub</a>
        </div>
      </div>
    </nav>
  )
}