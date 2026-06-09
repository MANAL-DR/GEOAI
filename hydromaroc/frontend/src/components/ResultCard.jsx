export default function ResultCard({ panelId, data, loading }) {
  if (!panelId) return null
  const configs = {
    'surface-water': {
      title   : 'Surface Water',
      icon    : '🌊',
      color   : '#1976D2',
      gradient: 'linear-gradient(135deg, #033e08, #0f3f11)',
      source  : 'JRC Global Surface Water v1.4',
      fields  : [
        { key: 'occurrence_pct',      label: 'Occurrence eau',    unit: '%'   },
        { key: 'permanent_km2',       label: 'Eau permanente',    unit: ' km²'},
        { key: 'seasonal_km2',        label: 'Eau saisonnière',   unit: ' km²'},
        { key: 'total_km2',           label: 'Surface totale',    unit: ' km²'},
        { key: 'seasonality_months',  label: 'Saisonnalité',      unit: ' mois'},
      ]
    },
    'precipitation': {
      title   : 'Précipitations',
      icon    : '🌧️',
      color   : '#00838F',
      gradient: 'linear-gradient(135deg, #006064, #00838F)',
      source  : 'CHIRPS v2.0 Daily',
      fields  : [
        { key: 'total_mm',          label: 'Total période',   unit: ' mm'     },
        { key: 'daily_avg_mm',      label: 'Moyenne/jour',    unit: ' mm/j'   },
        { key: 'monthly_avg_mm',    label: 'Moyenne/mois',    unit: ' mm/mois'},
        { key: 'annual_equiv_mm',   label: 'Equiv. annuel',   unit: ' mm/an'  },
        { key: 'rainy_days',        label: 'Jours de pluie',  unit: ' jours'  },
      ]
    },
    'temperature': {
        title   : 'Température',
        icon    : '🌡️',
        color   : '#f46d43',
        gradient: 'linear-gradient(135deg, #a50026, #f46d43)',
        source  : 'MODIS MOD11A2',
        fields  : [
            { key: 'lst_day_mean',   label: 'Temp. diurne moy.',  unit: ' °C' },
            { key: 'lst_night_mean', label: 'Temp. nocturne moy.', unit: ' °C' },
            { key: 'lst_min',        label: 'Temp. minimale',      unit: ' °C' },
            { key: 'lst_max',        label: 'Temp. maximale',      unit: ' °C' },
            { key: 'amplitude',      label: 'Amplitude jour/nuit', unit: ' °C' },
  ]
    },
    'land-suitability': {
  title   : 'Land Suitability',
  icon    : '🗺️',
  color   : '#006400',
  gradient: 'linear-gradient(135deg, #004d00, #006400)',
  source  : 'ESA WorldCover v200',
  fields  : [
    { key: 'dominant_class', label: 'Classe dominante', unit: ''     },
    { key: 'dominant_pct',   label: 'Couverture',       unit: '%'    },
    { key: 'total_km2',      label: 'Surface analysée', unit: ' km²' },
  ]
},
  }
  const config = configs[panelId]
  if (!config) return null
  return (
    <div style={{
      position    : 'absolute',
      top         : '72px',
      right       : '12px',
      zIndex      : 900,
      width       : '230px',
      background  : '#1a1d26',
      border      : `1px solid ${config.color}33`,
      borderRadius: '14px',
      overflow    : 'hidden',
      boxShadow   : `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${config.color}11`
    }}>

      {/* Header gradient */}
      <div style={{
        padding    : '12px 14px',
        background : config.gradient,
        display    : 'flex',
        alignItems : 'center',
        gap        : '10px'
      }}>
        <span style={{ fontSize: '22px' }}>{config.icon}</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
            {config.title}
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>
            {config.source}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '12px 14px' }}>

        {loading ? (
          <div style={{
            textAlign : 'center',
            padding   : '24px 0',
            color     : config.color,
            fontSize  : '12px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}></div>
            En cours...
          </div>

        ) : data ? (
          <>
            {/* Badge statut */}
            <div style={{
              display      : 'flex',
              alignItems   : 'center',
              gap          : '8px',
              padding      : '8px 10px',
              background   : (data.color || config.color) + '18',
              borderRadius : '10px',
              border       : `1px solid ${data.color || config.color}33`,
              marginBottom : '12px'
            }}>
              {/* Score circulaire */}
              </div>
            {/* Métriques */}
            {config.fields.map(field => (
              data[field.key] !== undefined && data[field.key] !== null && (
                <div key={field.key} style={{
                  display        : 'flex',
                  justifyContent : 'space-between',
                  alignItems     : 'center',
                  padding        : '6px 0',
                  borderBottom   : '1px solid #1e2130'
                }}>
                  <span style={{ fontSize: '11px', color: '#666' }}>
                    {field.label}
                  </span>
                  <span style={{
                    fontSize  : '12px',
                    fontWeight: '500',
                    color     : '#e8e8e4'
                  }}>
                    {data[field.key]}{field.unit}
                  </span>
                </div>
              )
            ))}
            {/* Classes WorldCover détectées */}
{panelId === 'land-suitability' && data?.classes && (
  <div style={{ marginTop: '10px' }}>
    <div style={{
      fontSize      : '9px',
      color         : '#555',
      textTransform : 'uppercase',
      letterSpacing : '0.06em',
      marginBottom  : '6px'
    }}>
      Occupation du sol (ESA WorldCover)
    </div>
    {Object.entries(data.classes)
      .sort((a, b) => b[1].pct - a[1].pct)
      .map(([code, info]) => (
        <div key={code} style={{
          display     : 'flex',
          alignItems  : 'center',
          gap         : '6px',
          marginBottom: '4px'
        }}>
          <div style={{
            width       : '10px',
            height      : '10px',
            borderRadius: '2px',
            background  : info.color,
            flexShrink  : 0,
            border      : '1px solid rgba(255,255,255,0.1)'
          }} />
          <div style={{ flex: 1, fontSize: '10px', color: '#aaa' }}>
            {info.label}
          </div>
          <div style={{ fontSize: '10px', color: '#e8e8e4', fontWeight: '500' }}>
            {info.pct}%
          </div>
          <div style={{ fontSize: '9px', color: '#555' }}>
            {info.area_km2} km²
          </div>
        </div>
      ))
    }
  </div>
)}

            {/* Dataset source */}
            <div style={{
              marginTop  : '10px',
              padding    : '5px 8px',
              background : '#0f1117',
              borderRadius: '6px',
              fontSize   : '9px',
              color      : '#444',
              textAlign  : 'center'
            }}>
            {data.dataset}
            </div>
          </>

        ) : (
          <div style={{
            textAlign : 'center',
            padding   : '20px 0',
            color     : '#333',
            fontSize  : '11px'
          }}>
            Sélectionne un point sur la carte
          </div>
        )}
      </div>
    </div>
  )
}