import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar
} from 'recharts'

const DATASETS = [
  {
    id      : 'chirps',
    label   : 'Précipitations',
    unit    : 'mm/jour',
    color   : '#378ADD',
    endpoint: '/api/timeseries/chirps',
    type    : 'bar',
    desc    : 'CHIRPS — Précipitations journalières'
  },
  {
    id      : 'grace',
    label   : 'Humidité sol',
    unit    : 'kg/m²',
    color   : '#1D9E75',
    endpoint: '/api/timeseries/grace',
    type    : 'line',
    desc    : 'GLDAS — Humidité zone racinaire'
  },
  {
    id      : 'modis',
    label   : 'Évapotranspiration',
    unit    : 'mm',
    color   : '#BA7517',
    endpoint: '/api/timeseries/modis-et',
    type    : 'line',
    desc    : 'MODIS MOD16A2 — ET toutes les 8 jours'
  },
  {
    id      : 'worldcover',
    label   : 'Usage des terres',
    unit    : '%',
    color   : '#9FE1CB',
    endpoint: '/api/worldcover',
    type    : 'pie',
    desc    : 'ESA WorldCover 2021 — Occupation du sol'
  }
]

const LANDCOVER_COLORS = {
  'Foret'        : '#085041',
  'Arbustes'     : '#3B6D11',
  'Prairie'      : '#9FE1CB',
  'Agriculture'  : '#FAC775',
  'Urbain'       : '#888780',
  'Sol nu'       : '#D4C5A9',
  'Eau'          : '#378ADD',
  'Zones humides': '#1D9E75',
  'Neige/Glace'  : '#E8E8E4',
  'Mangrove'     : '#085041',
  'Mousses'      : '#C0DD97'
}

export default function TimeSeriesPanel({ geometry, dateStart, dateEnd }) {
  const [activeDataset, setActiveDataset] = useState(null)
  const [data,          setData]          = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)

  const fetchDataset = async (dataset) => {
    if (!geometry) {
      alert('Selectionne une zone sur la carte d\'abord')
      return
    }

    setActiveDataset(dataset)
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const body = dataset.id === 'worldcover'
        ? { geometry }
        : { geometry, dateStart, dateEnd }

      const res  = await fetch(dataset.endpoint, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body)
      })

      const json = await res.json()
      setData(json)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderChart = () => {
    if (loading) return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#1D9E75', fontSize: '12px' }}>
        Calcul GEE en cours...
      </div>
    )

    if (error) return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#D85A30', fontSize: '12px' }}>
        Erreur : {error}
      </div>
    )

    if (!data) return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '12px' }}>
        Sélectionne un dataset ci-dessus
      </div>
    )

    // WorldCover — graphe barres horizontales
    if (activeDataset.id === 'worldcover') {
      const landcover = data.landcover || {}
      const chartData = Object.entries(landcover)
        .map(([k, v]) => ({ name: k, pct: v.pct, km2: v.km2 }))
        .sort((a, b) => b.pct - a.pct)

      return (
        <div>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px' }}>
            {data.dataset}
          </div>
          {chartData.map(item => (
            <div key={item.name} style={{ marginBottom: '8px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '11px', marginBottom: '3px'
              }}>
                <span style={{ color: '#e8e8e4' }}>{item.name}</span>
                <span style={{ color: '#888' }}>{item.pct}% · {item.km2} km²</span>
              </div>
              <div style={{
                height: '8px', background: '#2a2d3a',
                borderRadius: '4px', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${item.pct}%`,
                  background: LANDCOVER_COLORS[item.name] || '#1D9E75',
                  borderRadius: '4px',
                  transition: 'width 0.5s'
                }} />
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Time series — graphe linéaire ou barres
    const series   = data.series || []
    const unit     = data.unit   || ''
    const dataset  = data.dataset || ''

    if (series.length === 0) return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '12px' }}>
        Aucune donnée pour cette période
      </div>
    )

    // Formater les dates pour l'affichage
    const chartData = series.map(d => ({
      date : d.date.substring(0, 7),  // YYYY-MM
      value: d.value
    }))

    const avg = series.reduce((s, d) => s + d.value, 0) / series.length

    return (
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '11px', color: '#888', marginBottom: '12px'
        }}>
          <span>{dataset}</span>
          <span>Moy: {avg.toFixed(2)} {unit}</span>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          {activeDataset.type === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#666' }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 9, fill: '#666' }} />
              <Tooltip
                contentStyle={{
                  background: '#1a1d26', border: '1px solid #2a2d3a',
                  borderRadius: '6px', fontSize: '11px'
                }}
                formatter={(v) => [`${v} ${unit}`, activeDataset.label]}
              />
              <Bar dataKey="value" fill={activeDataset.color} radius={[2, 2, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#666' }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 9, fill: '#666' }} />
              <Tooltip
                contentStyle={{
                  background: '#1a1d26', border: '1px solid #2a2d3a',
                  borderRadius: '6px', fontSize: '11px'
                }}
                formatter={(v) => [`${v} ${unit}`, activeDataset.label]}
              />
              <ReferenceLine
                y={avg} stroke="#666"
                strokeDasharray="4 2"
                label={{ value: 'moy', fontSize: 9, fill: '#666' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={activeDataset.color}
                strokeWidth={2}
                dot={{ r: 3, fill: activeDataset.color }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  return (
  <div style={{
    height        : '100%',
    display       : 'flex',
    flexDirection : 'column',
    padding       : '12px 16px',
    overflow      : 'hidden'
  }}>

    {/* Header + boutons */}
    <div style={{
      display       : 'flex',
      alignItems    : 'center',
      gap           : '12px',
      marginBottom  : '10px',
      flexShrink    : 0
    }}>
      <div style={{
        fontSize     : '11px', fontWeight: '500',
        color        : '#e8e8e4',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace   : 'nowrap'
      }}>
        Series temporelles
      </div>

      {/* Boutons dataset */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {DATASETS.map(ds => (
          <button key={ds.id}
            onClick={() => fetchDataset(ds)}
            style={{
              padding     : '4px 12px',
              borderRadius: '6px',
              border      : activeDataset?.id === ds.id
                ? `1px solid ${ds.color}`
                : '1px solid #2a2d3a',
              background  : activeDataset?.id === ds.id
                ? ds.color + '22'
                : 'transparent',
              color       : activeDataset?.id === ds.id ? ds.color : '#888',
              fontSize    : '11px',
              cursor      : 'pointer',
              fontWeight  : activeDataset?.id === ds.id ? '500' : '400'
            }}>
            {ds.label}
          </button>
        ))}
      </div>
    </div>

    {/* Zone graphe — prend le reste de l'espace */}
    <div style={{ flex: 1, overflow: 'hidden' }}>
      {renderChart()}
    </div>

  </div>
)}