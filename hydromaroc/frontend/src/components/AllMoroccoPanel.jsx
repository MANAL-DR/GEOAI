const BOXES = [
  {
    id   : 'water-health',
    label: 'Water Health',
    icon : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C12 2 4 10.5 4 15.5C4 19.6 7.6 23 12 23C16.4 23 20 19.6 20 15.5C20 10.5 12 2 12 2Z"/>
      </svg>
    ),
    color      : '#1976D2',
    colorDark  : '#0D47A1',
    borderColor: '#1976D2',
    desc : 'Score hydrique par région'
  },
  {
    id   : 'water-sources',
    label: 'Water Sources',
    icon : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8 2 4 5 4 9c0 5.25 8 13 8 13s8-7.75 8-13c0-4-4-7-8-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
      </svg>
    ),
    color      : '#0288D1',
    colorDark  : '#1565C0',
    borderColor: '#0288D1',
    desc : 'Rivières, lacs, barrages'
  },
  {
    id   : 'agri',
    label: 'Classif Agricole',
    icon : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 8C8 10 5.9 16.17 3.82 19.34L5.71 21l1-1.29C7.64 18.55 9.53 17 12 17c3 0 5-2 5-5 0-.66-.08-1.29-.22-1.88A7.5 7.5 0 0 1 19 14c0 3.86-3.14 7-7 7s-7-3.14-7-7c0-2.76 1.59-5.15 3.91-6.32"/>
      </svg>
    ),
    color      : '#1D9E75',
    colorDark  : '#085041',
    borderColor: '#1D9E75',
    desc : 'Aptitude agricole'
  }
]

export default function AllMoroccoPanel({
  activeBox, setActiveBox,
  loading,
  waterSourcesInfo
}) {
  return (
    <>
      {/* 3 boutons en haut au centre */}
      <div style={{
        position      : 'absolute',
        top           : '12px',
        left          : '50%',
        transform     : 'translateX(-50%)',
        zIndex        : 1000,
        display       : 'flex',
        gap           : '8px'
      }}>
        {BOXES.map(box => {
          const isActive = activeBox === box.id
          const isLoading = loading && isActive

          return (
            <button
              key={box.id}
              onClick={() => !loading && setActiveBox(box.id)}
              disabled={loading}
              style={{
                padding      : '9px 18px',
                borderRadius : '10px',
                border       : isActive ? 'none' : '1px solid #2a2d3a',
                background   : isLoading
                  ? '#2a2d3a'
                  : isActive
                    ? `linear-gradient(135deg, ${box.colorDark}, ${box.color})`
                    : '#1a1d26cc',
                color        : isLoading ? '#666' : isActive ? '#fff' : '#aaa',
                fontWeight   : 500,
                fontSize     : '13px',
                cursor       : loading ? 'not-allowed' : 'pointer',
                display      : 'flex',
                alignItems   : 'center',
                gap          : '6px',
                transition   : 'all 0.2s',
                boxShadow    : isActive
                  ? `0 4px 15px ${box.color}44`
                  : 'none',
                backdropFilter: 'blur(8px)'
              }}>
              {box.icon}
              {isLoading ? 'Calcul...' : box.label}
            </button>
          )
        })}
      </div>

      {/* Info water sources */}
      {activeBox === 'water-sources' && waterSourcesInfo && (
        <div style={{
          position     : 'absolute',
          top          : '60px',
          left         : '50%',
          transform    : 'translateX(-50%)',
          background   : '#1a1d26cc',
          border       : '1px solid #1565C0',
          borderRadius : '8px',
          padding      : '6px 16px',
          fontSize     : '11px',
          color        : '#90CAF9',
          zIndex       : 1000,
          pointerEvents: 'none',
          whiteSpace   : 'nowrap'
        }}>
          {waterSourcesInfo}
        </div>
      )}
    </>
  )
}