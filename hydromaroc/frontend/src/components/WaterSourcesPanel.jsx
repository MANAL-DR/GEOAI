const LEGEND = [
  { color: '#1565C0', label: 'Rivière',       line: true,  dash: false },
  { color: '#1976D2', label: "Cours d'eau",   line: true,  dash: true  },
  { color: '#0288D1', label: 'Canal',         line: true,  dash: false },
  { color: '#1E88E5', label: "Plan d'eau",    line: false, dash: false },
  { color: '#26C6DA', label: 'Zone humide',   line: false, dash: false },
  { color: '#00ACC1', label: 'Source',        point: true              },
  { color: '#0D47A1', label: 'Barrage',       line: true,  dash: false },
]

export default function WaterSourcesPanel({ loading, count, selectedRegion }) {
  return (
    <>
      {/* Status banner — top center */}
      <div style={{
        position     : 'absolute', top: 10, left: '50%',
        transform    : 'translateX(-50%)',
        background   : '#1a1d26cc', border: '1px solid #1565C0',
        borderRadius : '8px', padding: '6px 16px',
        fontSize     : '11px', color: '#90CAF9',
        zIndex       : 1000, pointerEvents: 'none',
        whiteSpace   : 'nowrap'
      }}>
        {loading
          ? 'Chargement des sources...'
          : selectedRegion
            ? `${count ?? '...'} sources trouvées — ${selectedRegion}`
            : "Cliquez sur une région pour explorer ses sources d'eau"
        }
      </div>

      {/* Legend — bottom left */}
      <div style={{
        position    : 'absolute', bottom: 32, left: 16,
        background  : '#1a1d26', border: '1px solid #2a2d3a',
        borderRadius: '10px', padding: '12px 14px', zIndex: 1000
      }}>
        <div style={{
          fontSize      : 11, fontWeight: 600, color: '#666',
          textTransform : 'uppercase', letterSpacing: '0.05em',
          marginBottom  : 8
        }}>
          Sources d'eau
        </div>
        {LEGEND.map(({ color, label, line, dash, point }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center',
            gap: 8, marginBottom: 5
          }}>
            {point ? (
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: color, flexShrink: 0
              }} />
            ) : line ? (
              <div style={{
                width: 20, height: 3, flexShrink: 0, borderRadius: 2,
                background: dash
                  ? `repeating-linear-gradient(90deg,${color} 0,${color} 4px,transparent 4px,transparent 7px)`
                  : color
              }} />
            ) : (
              <div style={{
                width: 13, height: 13, borderRadius: 2,
                flexShrink: 0, background: color, opacity: 0.7
              }} />
            )}
            <span style={{ fontSize: 11, color: '#aaa' }}>{label}</span>
          </div>
        ))}
      </div>
    </>
  )
}