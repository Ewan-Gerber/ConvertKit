import { useNavigate } from 'react-router-dom'

export default function ToolCard({ tool }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/tool/${tool.id}`)}
      style={{
        border: '1px solid #e4e4e7',
        borderRadius: '12px',
        padding: '1.5rem',
        background: '#fff',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#2563eb'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#e4e4e7'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{tool.icon}</div>
      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#18181b', marginBottom: '0.375rem' }}>{tool.name}</div>
      <div style={{ fontSize: '0.8125rem', color: '#71717a', lineHeight: 1.5 }}>{tool.description}</div>
    </div>
  )
}