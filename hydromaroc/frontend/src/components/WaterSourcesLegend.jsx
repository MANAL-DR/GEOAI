const LEGEND = [
  { color: '#1565C0', label: 'Rivière',       line: true,  dash: false },
  { color: '#1976D2', label: "Cours d'eau",   line: true,  dash: true  },
  { color: '#0288D1', label: 'Canal',         line: true,  dash: false },
  { color: '#1E88E5', label: "Plan d'eau",    line: false, dash: false },
  { color: '#26C6DA', label: 'Zone humide',   line: false, dash: false },
  { color: '#00ACC1', label: 'Source',        point: true              },
  { color: '#0D47A1', label: 'Barrage',       line: true,  dash: false },
]

export default function WaterSourcesLegend() {
  return (
    <div style={{
      position    : 'absolute',
      bottom      : '56px',
      left        : '16px',
      background  : '#1a1d26',
      border      : '1px solid #2a2d3a',
      borderRadius: '10px',
      padding     : '12px 14px',
      zIndex      : 1000
    }}>
      <div style={{
        fontSize      : '11px', fontWeight: '600', color: '#666',
        textTransform : 'uppercase', letterSpacing: '0.05em',
        marginBottom  : '8px'
      }}>
        Sources d'eau
      </div>

      {LEGEND.map(({ color, label, line, dash, point }) => (
        <div key={label} style={{
          display    : 'flex', alignItems: 'center',
          gap        : '8px', marginBottom: '5px'
        }}>
          {point ? (
            <div style={{
              width: '10px', height: '10px',
              borderRadius: '50%', background: color, flexShrink: 0
            }} />
          ) : line ? (
            <div style={{
              width: '20px', height: '3px', flexShrink: 0, borderRadius: '2px',
              background: dash
                ? `repeating-linear-gradient(90deg,${color} 0,${color} 4px,transparent 4px,transparent 7px)`
                : color
            }} />
          ) : (
            <div style={{
              width: '13px', height: '13px', borderRadius: '2px',
              flexShrink: 0, background: color, opacity: 0.7
            }} />
          )}
          <span style={{ fontSize: '11px', color: '#aaa' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}