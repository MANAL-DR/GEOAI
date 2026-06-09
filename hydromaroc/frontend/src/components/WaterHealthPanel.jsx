export default function WaterHealthPanel() {
  const items = [
    { color: '#0D47A1', label: 'High (75–100)'    },
    { color: '#1976D2', label: 'Moderate (50–74)' },
    { color: '#90CAF9', label: 'Low (25–49)'      },
    { color: '#E3F2FD', label: 'Very low (0–24)'  },
  ]

  return (
    <div style={{
      position    : 'absolute', bottom: 32, left: 16,
      background  : '#1a1d26', border: '1px solid #2a2d3a',
      borderRadius: '10px', padding: '12px 16px', zIndex: 1000
    }}>
      <div style={{
        fontSize      : 11, fontWeight: 600, color: '#666',
        textTransform : 'uppercase', letterSpacing: '0.05em',
        marginBottom  : 8
      }}>
        Water health score
      </div>
      {items.map(({ color, label }) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center',
          gap: 8, marginBottom: 5
        }}>
          <div style={{
            width: 13, height: 13, borderRadius: 3,
            background: color, border: '1px solid #333'
          }} />
          <span style={{ fontSize: 12, color: '#aaa' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}