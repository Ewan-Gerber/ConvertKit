import { useState, useRef } from 'react'

export default function DropZone({ onFiles, accept, multiple = false, label, reorderable = false }) {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState([])
  const [dragIndex, setDragIndex] = useState(null)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    const valid = dropped.filter(f => accept ? accept.some(a => f.name.toLowerCase().endsWith(`.${a}`) || f.name.toLowerCase().endsWith(a)) : true)
    if (!valid.length) return
    const selected = multiple ? valid : [valid[0]]
    setFiles(prev => {
      const updated = multiple ? [...prev, ...selected] : selected
      const unique = updated.filter((f, i, arr) => arr.findIndex(x => x.name === f.name) === i)
      onFiles(unique)
      return unique
    })
  }

  const handleChange = (e) => {
    const selected = multiple ? Array.from(e.target.files) : [e.target.files[0]]
    setFiles(prev => {
      const updated = multiple ? [...prev, ...selected] : selected
      const unique = updated.filter((f, i, arr) => arr.findIndex(x => x.name === f.name) === i)
      onFiles(unique)
      return unique
    })
  }

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onFiles(updated)
  }

  const handleDragStart = (index) => {
    setDragIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const updated = [...files]
    const dragged = updated.splice(dragIndex, 1)[0]
    updated.splice(index, 0, dragged)
    setDragIndex(index)
    setFiles(updated)
    onFiles(updated)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? '#2563eb' : '#d4d4d8'}`,
          borderRadius: '12px',
          padding: 'clamp(1.25rem, 4vw, 3rem) 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#eff6ff' : '#fafafa',
          transition: 'all 0.15s',
        }}
      >
        <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📄</div>
        <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#18181b', marginBottom: '0.25rem' }}>
          {label || 'Drop your file here'}
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#2563eb', fontWeight: 500 }}>
          tap to browse
        </div>
        {accept && (
          <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.5rem' }}>
            Accepted: {accept.join(', ')}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept ? accept.map(a => `.${a}`).join(',') : '*'}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {reorderable && files.length > 1 && (
            <p style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>
              Drag to reorder — files will be merged in the order shown
            </p>
          )}
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              draggable={reorderable}
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.625rem 0.875rem',
                background: dragIndex === i ? '#eff6ff' : '#fff',
                border: `1px solid ${dragIndex === i ? '#2563eb' : '#e4e4e7'}`,
                borderRadius: '8px',
                cursor: reorderable ? 'grab' : 'default',
                transition: 'all 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                {reorderable && (
                  <span style={{ color: '#a1a1aa', fontSize: '0.875rem', userSelect: 'none' }}>⠿</span>
                )}
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, minWidth: '20px' }}>
                  {reorderable ? `${i + 1}.` : ''}
                </span>
                <span style={{ fontSize: '0.875rem', color: '#18181b', fontWeight: 500 }}>{file.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{(file.size / 1024).toFixed(0)} KB</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', fontSize: '1rem', padding: '0.25rem' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}