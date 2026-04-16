import { useNavigate } from 'react-router-dom'
import ToolCard from '../components/ToolCard'
import { TOOLS } from '../tools'

export default function Home() {
  const navigate = useNavigate()

  const getRecentTools = () => {
    try {
      const recent = JSON.parse(localStorage.getItem('recent_tools') || '[]')
      return TOOLS.filter(t => recent.includes(t.id)).slice(0, 3)
    } catch {
      return []
    }
  }

  const recentTools = getRecentTools()

  return (
    <div>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem 2rem' }}>

        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#18181b', marginBottom: '0.75rem', lineHeight: 1.15 }}>
            Every file tool<br />you actually need
          </h1>
          <p style={{ fontSize: '1.0625rem', color: '#71717a', maxWidth: '480px', marginBottom: '1.5rem' }}>
            Convert, compress and transform PDFs and images. No sign up, no watermarks, no nonsense.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {['7 tools', 'No sign up', 'Files never stored', 'Free forever'].map(stat => (
              <span key={stat} style={{ fontSize: '0.8125rem', color: '#2563eb', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }}></span>
                {stat}
              </span>
            ))}
          </div>
        </div>

        {recentTools.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Recently used</p>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {recentTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => navigate(`/tool/${tool.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', border: '1px solid #e4e4e7', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', color: '#18181b', fontWeight: 500, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e4e4e7'}
                >
                  <span style={{ fontSize: '1rem' }}>{tool.icon}</span>
                  {tool.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>PDF tools</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {TOOLS.filter(t => ['merge-pdf', 'split-pdf', 'compress-pdf', 'images-to-pdf', 'pdf-to-images', 'rotate-pdf'].includes(t.id)).map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Image tools</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {TOOLS.filter(t => ['resize-image'].includes(t.id)).map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', marginTop: '-3rem', marginBottom: '4rem' }}>
          Word ↔ PDF conversion available in the local version. Requires LibreOffice.
        </p>

        <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '4rem', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#18181b', marginBottom: '2.5rem' }}>
            How it works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
            {[
              { step: '01', title: 'Pick a tool', desc: 'Choose from PDF or image tools above.' },
              { step: '02', title: 'Upload your file', desc: 'Drag and drop or click to browse your files.' },
              { step: '03', title: 'Convert', desc: 'We process your file instantly on our servers.' },
              { step: '04', title: 'Download', desc: 'Your converted file downloads automatically.' },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{step}</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#18181b', marginBottom: '0.375rem' }}>{title}</div>
                <div style={{ fontSize: '0.8125rem', color: '#71717a', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#18181b', letterSpacing: '-0.01em' }}>
              Convert<span style={{ color: '#2563eb' }}>Kit</span>
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#a1a1aa', marginLeft: '1rem' }}>
              Free file conversion tools. No sign up required.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="https://github.com/Ewan-Gerber" target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: '#71717a', textDecoration: 'none' }}>GitHub</a>
            <a href="https://www.linkedin.com/in/ewan-gerber" target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: '#71717a', textDecoration: 'none' }}>LinkedIn</a>
          </div>
        </div>

      </div>
    </div>
  )
}