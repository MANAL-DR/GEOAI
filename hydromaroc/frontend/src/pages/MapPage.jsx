import { useState, useCallback } from 'react'
import MapView              from '../components/MapView'
import Sidebar              from '../components/Sidebar'
import ClassifPanel         from '../components/ClassifPanel'
import TimeSeriesPanel      from '../components/TimeSeriesPanel'
{/*import AllMoroccoPanel      from '../components/AllMoroccoPanel'*/}
{/* import AnalysisPanel   from '../components/AnalysisPanel'    !!!!!!!!!!!!*/} 
import ResultCard      from '../components/ResultCard'
import MapLegend       from '../components/MapLegend'  

import Navbar from '../components/navbar'
import BottomPanel from '../components/BottomPanel'

{/*import WaterSourcesLegend   from '../components/WaterSourcesLegend'    */}
import {
  fetchClassify,
  fetchWaterAnalysis,
  fetchSurfaceWater,
  fetchPrecipitation,
  fetchAllMoroccoWaterHealth,
  fetchWaterSources,
  fetchSurfaceWaterTile,
  fetchPrecipitationTile,
  fetchAllMoroccoSurfaceWaterTile,
  fetchAllMoroccoPrecipitationTile
} from '../api/geeApi'


export default function MapPage() {
  const [mode,           setMode]           = useState('bin')
  const [dateStart,      setDateStart]      = useState('2023-01-01')
  const [dateEnd,        setDateEnd]        = useState('2023-12-31')
  const [geometry,       setGeometry]       = useState(null)
  const [result,         setResult]         = useState(null)
  const [waterResult,    setWaterResult]    = useState(null)
  const [loading,        setLoading]        = useState(false)
  
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [regionName,     setRegionName]     = useState(null)

  // AllMorocco states
  const [activeBox,      setActiveBox]      = useState(null)
  const [regionsData,    setRegionsData]    = useState(null)
  const [allLoading,     setAllLoading]     = useState(false)
  const [wsInfo,         setWsInfo]         = useState(null)
  const [selectedAllReg, setSelectedAllReg] = useState(null)
  const [waterSourcesGeoJSON, setWaterSourcesGeoJSON] = useState(null)

  const [activePanel,  setActivePanel]  = useState(null)
  const [panelData,    setPanelData]    = useState(null)
  const [panelLoading, setPanelLoading] = useState(false)
  const [tileUrl,    setTileUrl]    = useState(null)
  const [tileLegend, setTileLegend] = useState(null)
  const [tileTitle,  setTileTitle]  = useState(null)


  const handleSelect = useCallback((geom, name = null) => {
    setGeometry(geom)
    setResult(null)
    setWaterResult(null)
    setRegionName(name || null)
  }, [])

  const handleAnalyze = async () => {
    if (!geometry) { alert('Selectionne une zone'); return }
    if (new Date(dateStart) >= new Date(dateEnd)) { alert('Dates invalides'); return }
    setLoading(true)
    try {
      const data = await fetchClassify(geometry, dateStart, dateEnd)
      setResult(data)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleWaterAnalysis = async () => {
    if (!geometry) { alert('Selectionne une zone'); return }
    setWaterLoading(true)
    try {
      const data = await fetchWaterAnalysis(geometry, dateStart, dateEnd)
      setWaterResult(data)
    } catch (err) {
      alert('Erreur water : ' + err.message)
    } finally {
      setWaterLoading(false)
    }
  }

  // AllMorocco — clic sur une box
  const handleBoxClick = async (boxId) => {
    setActiveBox(boxId)
    setRegionsData(null)
    setSelectedAllReg(null)
    setWsInfo(null)
    setAllLoading(true)

    try {
      if (boxId === 'water-health') {
        const data = await fetchAllMoroccoWaterHealth(dateStart, dateEnd)
        const regions = data.features.map(f => ({
            name    : f.properties.NAME_1,
            score   : f.properties.water_score,
            color   : f.properties.fill_color,
            geometry: f.geometry
       }))
       setRegionsData(regions)
      } else if (boxId === 'agri') {
        const data = await fetchAllMoroccoAgriHealth(dateStart, dateEnd)
        setRegionsData(data.regions)

      } else if (boxId === 'water-sources') {
        // Pour water-sources : charger le GeoJSON des régions
        // et attendre que l'utilisateur clique sur une région
        const res  = await fetch('/data/maroc_regions.geojson')
        const json = await res.json()
        // Afficher les régions sans couleur spéciale
        setRegionsData(json.features.map(f => ({
          name    : f.properties.NAME_1,
          color   : '#1565C022',
          geometry: f.geometry
        })))
        setWsInfo("Cliquez sur une région pour explorer ses sources d'eau")
      }
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setAllLoading(false)
    }
  }

  // AllMorocco — clic sur une région colorée
  const handleRegionClick = async (regionInfo) => {
    setSelectedAllReg(regionInfo)

   if (activeBox === 'water-sources') {
  setAllLoading(true)
  setWsInfo(`Chargement sources — ${regionInfo.name}...`)
  try {
    const data = await fetchWaterSources(regionInfo.name)
    setWaterSourcesGeoJSON(data)
    setWsInfo(`${data.count} sources trouvées — ${regionInfo.name}`)
  } catch (err) {
    setWsInfo('Erreur chargement sources')
  } finally {
    setAllLoading(false)
  }
}
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Navbar/>
      <Sidebar
        mode={mode}
        setMode={(m) => {
          setMode(m)
          setActivePanel(null)
          setPanelData(null)
          setRegionsData(null)
          setTileUrl(null)
          setTileLegend(null)
          setWaterSourcesGeoJSON(null)
        }}
        dateStart={dateStart} setDateStart={setDateStart}
        dateEnd={dateEnd}     setDateEnd={setDateEnd}
        onAnalyze={handleAnalyze}
        onWaterAnalysis={handleWaterAnalysis}
        loading={loading || panelLoading || allLoading}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        <div style={{ width: '100%', height: '100%' }}>
          <MapView
            mode={mode}
            onSelect={handleSelect}
            regionsData={regionsData}
            onRegionClick={handleRegionClick}
            waterSourcesGeoJSON={waterSourcesGeoJSON}
            tileUrl={tileUrl}
          />
        </div>

        {/* Panel 4 boutons 
        <AnalysisPanel
          activePanel={activePanel}
          onPanelClick={handlePanelClick}
          loading={panelLoading || allLoading}
        />
        */}

        {/* ResultCard — bin/box/region */}
        {mode !== 'allmorocco' &&
         (activePanel === 'surface-water' || activePanel === 'precipitation') && (
          <ResultCard
            panelId={activePanel}
            data={panelData}
            loading={panelLoading}
          />
        )}

        {/* Légende tile */}
        {tileUrl && tileLegend && (
          <MapLegend legend={tileLegend} title={tileTitle} />
        )}

        {/* Légende Surface Water AllMorocco */}
        {mode === 'allmorocco' && activePanel === 'surface-water' && (
  <div style={{
    position: 'absolute', bottom: '56px', right: '16px',
    background: '#1a1d26', border: '1px solid #2a2d3a',
    borderRadius: '10px', padding: '12px 14px',
    zIndex: 1000, maxHeight: '300px', overflowY: 'auto'
  }}>
    <div style={{
      fontSize: '10px', fontWeight: '600', color: '#666',
      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px'
    }}>
      JRC Transition Classes
    </div>
    {[
      { color: '#E3F2FD', label: 'No water'              },
      { color: '#0D47A1', label: 'Permanent water'       },
      { color: '#00BCD4', label: 'New permanent water'   },
      { color: '#D32F2F', label: 'Lost permanent water'  },
      { color: '#1976D2', label: 'Seasonal water'        },
      { color: '#388E3C', label: 'New seasonal water'    },
      { color: '#F57C00', label: 'Lost seasonal water'   },
      { color: '#FBC02D', label: 'Dried seasonal water'  },
      { color: '#7B1FA2', label: 'Ephemeral water'       },
      { color: '#00796B', label: 'Seasonal to permanent' },
      { color: '#E91E63', label: 'Permanent to seasonal' },
      { color: '#303F9F', label: 'Ephemeral to permanent'},
    ].map(item => (
      <div key={item.label} style={{
        display: 'flex', alignItems: 'center',
        gap: '8px', marginBottom: '5px'
      }}>
        <div style={{
          width: '12px', height: '12px', borderRadius: '3px',
          background: item.color, border: '1px solid #333', flexShrink: 0
        }} />
        <span style={{ fontSize: '10px', color: '#aaa' }}>{item.label}</span>
      </div>
    ))}
  </div>
)}

        {/* Légende Précipitations AllMorocco */}
        {mode === 'allmorocco' && activePanel === 'precipitation' && (
          <div style={{
            position: 'absolute', bottom: '56px', right: '16px',
            background: '#1a1d26', border: '1px solid #2a2d3a',
            borderRadius: '10px', padding: '12px 14px', zIndex: 1000
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '600', color: '#666',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px'
            }}>
              Precipitations
            </div>
            {[
              {'color': '#ffffff', 'label': '0 mm'},
              {'color': '#ffffb2', 'label': '<100 mm'},
              {'color': '#fecc5c', 'label': '<200 mm'},
              {'color': '#fd8d3c', 'label': '<300 mm'},
              {'color': '#f03b20', 'label': '<500 mm'},
              {'color': '#bd0026', 'label': '>800 mm'}, 
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center',
                gap: '8px', marginBottom: '5px'
              }}>
                <div style={{
                  width: '13px', height: '13px', borderRadius: '3px',
                  background: item.color, border: '1px solid #333'
                }} />
                <span style={{ fontSize: '11px', color: '#aaa' }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ClassifPanel */}
        {result && mode !== 'allmorocco' && (
          <div style={{ position: 'absolute', top: '72px', right: '12px', zIndex: 900 }}>
            <ClassifPanel result={result} waterResult={null} />
          </div>
        )}

        {/* Nom région */}
        {regionName && (
          <div style={{
            position: 'absolute', bottom: '56px', left: '12px', zIndex: 900,
            background: '#1a1d26cc', border: '1px solid #378ADD',
            borderRadius: '8px', padding: '6px 14px',
            fontSize: '12px', color: '#378ADD', fontWeight: '500'
          }}>
            {regionName}
          </div>
        )}

        {/* Loading */}
        {(loading || panelLoading || allLoading) && (
          <div style={{
            position : 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#1a1d26', border: '1px solid #2a2d3a',
            borderRadius: '12px', padding: '16px 28px',
            fontSize: '13px', color: '#1D9E75', zIndex: 1000
          }}>
            {allLoading
              ? 'calcul nationnale'
              : 'Calcul GEE en cours...'}
          </div>
        )}

        {/* Drawer */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(calc(100% - 44px))'
        }}>
          <div onClick={() => setDrawerOpen(!drawerOpen)} style={{
            height: '44px', background: '#1a1d26',
            borderTop: '1px solid #2a2d3a',
            borderLeft: '1px solid #2a2d3a',
            borderRight: '1px solid #2a2d3a',
            borderRadius: '12px 12px 0 0',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px', cursor: 'pointer', userSelect: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '3px', background: '#3a3d4a', borderRadius: '2px' }} />
              <span style={{
                fontSize: '11px', fontWeight: '500', color: '#e8e8e4',
                letterSpacing: '0.06em', textTransform: 'uppercase'
              }}>
                Series temporelles
                {regionName && (
                  <span style={{ color: '#378ADD', marginLeft: '8px', fontWeight: '400' }}>
                    — {regionName}
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['Precipitations', 'Humidite sol', 'Evapotranspiration', 'Usage des terres'].map((label, i) => (
                <span key={i} style={{
                  fontSize: '10px', color: '#555',
                  padding: '2px 8px', border: '1px solid #2a2d3a', borderRadius: '10px'
                }}>
                  {label}
                </span>
              ))}
            </div>
            <span style={{
              color: '#666', fontSize: '14px',
              transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}>▲</span>
          </div>
          <div style={{
            height: '340px', background: '#13151f',
            borderLeft: '1px solid #2a2d3a', borderRight: '1px solid #2a2d3a',
            overflow: 'hidden'
          }}>
            <TimeSeriesPanel geometry={geometry} dateStart={dateStart} dateEnd={dateEnd} />
          </div>
        </div>
            {/* Drawer */}
            <BottomPanel onPanelSelect={setActivePanel}/>
      </div>
    </div>
        
      
  )
}