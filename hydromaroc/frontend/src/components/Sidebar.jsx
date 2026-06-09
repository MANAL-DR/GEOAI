const MODES = [
  { id: 'bin',    label: 'Drop Bin',    desc: 'Point GPS precis' },
  { id: 'box',    label: 'Drop Box',    desc: 'Zone rectangulaire' },
  { id: 'region', label: 'Drop Region', desc: 'Region administrative' },
  { id: 'allmorocco', label: 'All Morocco', desc: 'Analyse nationale' },
]

export default function Sidebar({
  mode, setMode,
  dateStart, setDateStart,
  dateEnd, setDateEnd,
  onAnalyze, onWaterAnalysis,
  onAllMorocco,
  isAllMorocco,
  loading
}) {
  return (
    <div style={{
      width: '260px', height: '100%',
      background: '#1a1d26',
      borderRight: '1px solid #2a2d3a',
      padding: '16px', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: '16px'
    }}>

      

      {/* Modes de selection */}
      <div>
        <div style={{
          fontSize: '10px', color: '#888',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px'
        }}>
          Mode de selection
        </div>
        {MODES.map(m => (
          <div key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '10px 12px', borderRadius: '8px',
            cursor: 'pointer', marginBottom: '6px',
            border: mode === m.id ? '1px solid #1D9E75' : '1px solid #2a2d3a',
            background: mode === m.id ? '#0d2b1f' : 'transparent'
          }}>
            <div style={{
              fontSize: '12px', fontWeight: '500',
              color: mode === m.id ? '#1D9E75' : '#e8e8e4'
            }}>
              {m.label}
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
              {m.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Periode */}
      <div>
        <div style={{
          fontSize: '10px', color: '#888',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px'
        }}>
          Periode
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
              Date debut
            </div>
            <input type="date" value={dateStart}
              onChange={e => setDateStart(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: '6px',
                background: '#0f1117', border: '1px solid #2a2d3a',
                color: '#e8e8e4', fontSize: '12px', colorScheme: 'dark'
              }} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
              Date fin
            </div>
            <input type="date" value={dateEnd}
              onChange={e => setDateEnd(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: '6px',
                background: '#0f1117', border: '1px solid #2a2d3a',
                color: '#e8e8e4', fontSize: '12px', colorScheme: 'dark'
              }} />
          </div>
        </div>
      </div>
      

{/* Bouton Analyser — caché en mode allmorocco */}
{mode !== 'allmorocco' && (
  <button onClick={onAnalyze} disabled={loading} style={{
    width: '100%', padding: '10px', borderRadius: '8px',
    background: loading ? '#2a2d3a' : '#1D9E75',
    color: loading ? '#666' : '#fff',
    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '13px', fontWeight: '500'
  }}>
    {loading ? 'Analyse en cours...' : 'Analyser la zone'}
  </button>
)}

{/* Water Analysis — visible uniquement en mode region */}
{mode === 'region' && (
  <button onClick={onWaterAnalysis} disabled={loading} style={{
    width: '100%', padding: '10px', borderRadius: '8px',
    background: loading ? '#2a2d3a' : '#0C447C',
    color: loading ? '#666' : '#fff',
    border: '1px solid #378ADD',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '13px', fontWeight: '500'
  }}>
    Water Analysis
  </button>
)}
 </div>
  )
}
