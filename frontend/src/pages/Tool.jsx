import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TOOLS } from '../tools'
import DropZone from '../components/DropZone'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

export default function Tool() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tool = TOOLS.find(t => t.id === id)

  const [files, setFiles] = useState([])
  const [extraValues, setExtraValues] = useState(
    tool?.extraFields?.reduce((acc, f) => ({ ...acc, [f.name]: f.default }), {}) || {}
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sizeInfo, setSizeInfo] = useState(null)

  if (!tool) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#71717a' }}>Tool not found.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Go home</button>
      </div>
    )
  }

  const reset = () => {
    setFiles([])
    setExtraValues(tool?.extraFields?.reduce((acc, f) => ({ ...acc, [f.name]: f.default }), {}) || {})
    setDone(false)
    setError('')
    setSizeInfo(null)
  }

  const handleConvert = async () => {
    if (!files.length) { setError('Please select a file first'); return }
    setLoading(true)
    setError('')
    setDone(false)
    setSizeInfo(null)

    try {
      const formData = new FormData()

      if (tool.multiple) {
        files.forEach(f => formData.append(tool.fileField, f))
      } else {
        formData.append(tool.fileField, files[0])
      }

      if (tool.extraFields) {
        tool.extraFields.forEach(field => {
          if (extraValues[field.name] !== '') {
            formData.append(field.name, extraValues[field.name])
          }
        })
      }

      const res = await axios.post(`${API}${tool.endpoint}`, formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const originalSize = res.headers['x-original-size']
      const compressedSize = res.headers['x-compressed-size']
      if (originalSize && compressedSize) {
        const saved = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
        setSizeInfo({ original: (originalSize / 1024).toFixed(0), compressed: (compressedSize / 1024).toFixed(0), saved })
      }

      const contentDisposition = res.headers['content-disposition']
      const extMap = { 'word-to-pdf': 'pdf', 'pdf-to-word': 'docx', 'pdf-to-images': 'zip' }
      const defaultExt = extMap[tool.id] || 'pdf'
      let filename = `converted.${defaultExt}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i) ||
                      contentDisposition.match(/filename="?([^";]+)"?/i)
        if (match) filename = decodeURIComponent(match[1].trim())
      }

      const mimeType = res.headers['content-type'] || 'application/octet-stream'
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setDone(true)
    } catch (err) {
      try {
        const text = await err.response?.data?.text()
        const json = JSON.parse(text)
        setError(json.detail || 'Something went wrong')
      } catch {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: '0.875rem', marginBottom: '2rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
      >
        ← Back
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{tool.icon}</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#18181b', marginBottom: '0.375rem' }}>{tool.name}</h1>
        <p style={{ color: '#71717a', fontSize: '0.9375rem' }}>{tool.description}</p>
      </div>

      <DropZone
        onFiles={setFiles}
        accept={tool.accept}
        multiple={tool.multiple}
        label={tool.inputLabel}
        reorderable={tool.reorderable || false}
      />

      {tool.extraFields && tool.extraFields.length > 0 && (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tool.extraFields.map(field => (
            <div key={field.name}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#18181b', marginBottom: '0.375rem' }}>
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  value={extraValues[field.name]}
                  onChange={e => setExtraValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                  style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: '#fff', color: '#18181b', width: '100%' }}
                >
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={extraValues[field.name]}
                  onChange={e => setExtraValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                  placeholder={field.label}
                  style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', background: '#fff', color: '#18181b', width: '100%' }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {done && (
        <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
          <div style={{ color: '#16a34a', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            {sizeInfo
              ? `Done — reduced from ${sizeInfo.original} KB to ${sizeInfo.compressed} KB (${sizeInfo.saved}% smaller)`
              : 'Done — your file is downloading'}
          </div>
          <button
            onClick={reset}
            style={{ background: 'none', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', color: '#16a34a', cursor: 'pointer' }}
          >
            Convert another file
          </button>
        </div>
      )}

      {loading && (
        <div style={{ marginTop: '1rem', height: '4px', background: '#e4e4e7', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: '#2563eb',
            borderRadius: '2px',
            animation: 'progress 1.5s ease-in-out infinite',
            width: '40%',
          }} />
          <style>{`@keyframes progress { 0% { transform: translateX(-100%) } 100% { transform: translateX(350%) } }`}</style>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={loading || !files.length}
        style={{
          marginTop: '1.5rem',
          width: '100%',
          background: loading || !files.length ? '#e4e4e7' : '#2563eb',
          color: loading || !files.length ? '#a1a1aa' : '#fff',
          border: 'none',
          borderRadius: '10px',
          padding: '0.875rem',
          fontSize: '0.9375rem',
          fontWeight: 600,
          cursor: loading || !files.length ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {loading ? 'Converting...' : `Convert with ${tool.name}`}
      </button>
    </div>
  )
}