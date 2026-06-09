const LEGENDS = {
  NDWI: {
    label  : 'NDWI — Eau de surface',
    unit   : 'Normalized Difference Water Index',
    palette: [
      { color: '#D85A30', label: '< -0.3  Sol très sec' },
      { color: '#BA7517', label: '-0.3 → 0  Sol sec' },
      { color: '#FAC775', label: '0 → 0.1  Humidité faible' },
      { color: '#9FE1CB', label: '0.1 → 0.3  Humide' },
      { color: '#1D9E75', label: '> 0.3  Eau présente' },
    ]
  },
  NDVI: {
    label  : 'NDVI — Végétation',
    unit   : 'Normalized Difference Vegetation Index',
    palette: [
      { color: '#D85A30', label: '< 0.1  Sol nu / désert' },
      { color: '#FAC775', label: '0.1 → 0.2  Végétation très sparse' },
      { color: '#9FE1CB', label: '0.2 → 0.4  Végétation modérée' },
      { color: '#1D9E75', label: '0.4 → 0.6  Végétation dense' },
      { color: '#085041', label: '> 0.6  Forêt / culture intensive' },
    ]
  },
  LSWI: {
    label  : 'LSWI — Humidité sol/végétation',
    unit   : 'Land Surface Water Index',
    palette: [
      { color: '#D85A30', label: '< -0.2  Très sec' },
      { color: '#FAC775', label: '-0.2 → 0  Stress hydrique' },
      { color: '#9FE1CB', label: '0 → 0.2  Humidité modérée' },
      { color: '#1D9E75', label: '> 0.2  Bien hydraté' },
      { color: '#085041', label: '> 0.4  Très humide' },
    ]
  },
  NDMI: {
    label  : 'NDMI — Stress hydrique',
    unit   : 'Normalized Difference Moisture Index',
    palette: [
      { color: '#D85A30', label: '< -0.2  Sécheresse sévère' },
      { color: '#FAC775', label: '-0.2 → 0  Stress modéré' },
      { color: '#9FE1CB', label: '0 → 0.2  Humidité correcte' },
      { color: '#1D9E75', label: '> 0.2  Pas de stress' },
      { color: '#085041', label: '> 0.4  Très humide' },
    ]
  },
  SAVI: {
    label  : 'SAVI — Végétation (zones arides)',
    unit   : 'Soil Adjusted Vegetation Index',
    palette: [
      { color: '#D85A30', label: '< 0.1  Sol nu' },
      { color: '#FAC775', label: '0.1 → 0.2  Très sparse' },
      { color: '#9FE1CB', label: '0.2 → 0.35  Végétation modérée' },
      { color: '#1D9E75', label: '0.35 → 0.5  Végétation significative' },
      { color: '#085041', label: '> 0.5  Dense' },
    ]
  },
  BSI: {
    label  : 'BSI — Sol nu / Érosion',
    unit   : 'Bare Soil Index',
    palette: [
      { color: '#1D9E75', label: '< -0.1  Sol bien couvert' },
      { color: '#9FE1CB', label: '-0.1 → 0  Sol partiellement couvert' },
      { color: '#FAC775', label: '0 → 0.1  Sol exposé' },
      { color: '#BA7517', label: '0.1 → 0.2  Sol très exposé' },
      { color: '#D85A30', label: '> 0.2  Sol nu / érosion' },
    ]
  },
  EVI: {
    label  : 'EVI — Végétation (corrigé)',
    unit   : 'Enhanced Vegetation Index',
    palette: [
      { color: '#D85A30', label: '< 0.1  Pas de végétation' },
      { color: '#FAC775', label: '0.1 → 0.2  Très sparse' },
      { color: '#9FE1CB', label: '0.2 → 0.4  Modéré' },
      { color: '#1D9E75', label: '0.4 → 0.6  Dense' },
      { color: '#085041', label: '> 0.6  Très dense' },
    ]
  }
}

export default function MapLegend({ index }) {
  if (!index || !LEGENDS[index]) return null

  const legend = LEGENDS[index]

  return (
    <div style={{
      position    : 'absolute',
      bottom      : '56px',
      left        : '12px',
      zIndex      : 900,
      background  : '#1a1d26cc',
      border      : '1px solid #2a2d3a',
      borderRadius: '10px',
      padding     : '10px 12px',
      minWidth    : '200px'
    }}>
      {/* Titre */}
      <div style={{
        fontSize    : '11px', fontWeight: '500',
        color       : '#e8e8e4', marginBottom: '2px'
      }}>
        {legend.label}
      </div>
      <div style={{
        fontSize    : '9px', color: '#555',
        marginBottom: '8px'
      }}>
        {legend.unit}
      </div>

      {/* Palette */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {legend.palette.map((item, i) => (
          <div key={i} style={{
            display    : 'flex',
            alignItems : 'center',
            gap        : '8px'
          }}>
            <div style={{
              width       : '12px', height: '12px',
              borderRadius: '3px',
              background  : item.color,
              flexShrink  : 0
            }} />
            <span style={{ fontSize: '10px', color: '#aaa' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}