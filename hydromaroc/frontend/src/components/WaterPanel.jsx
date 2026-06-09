export default function WaterPanel({ result }) {
  if (!result) return null
  const { label, color, indices, jrc, osm, surface_water, ground_water } = result
  const colorLight = color + '22'

  return (
    <div style={{ padding: '4px 0' }}>

      {/* Surface Water */}
      {surface_water && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: '9px', color: '#378ADD',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            🌊 Surface Water (JRC)
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{
              flex: 1, padding: '8px', background: '#0C447C22',
              borderRadius: '8px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#378ADD' }}>
                {surface_water.permanent_km2} km²
              </div>
              <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                Eau permanente
              </div>
            </div>
            <div style={{
              flex: 1, padding: '8px', background: '#0C447C22',
              borderRadius: '8px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#378ADD' }}>
                {surface_water.seasonal_km2} km²
              </div>
              <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                Eau saisonnière
              </div>
            </div>
            <div style={{
              flex: 1, padding: '8px', background: '#0C447C33',
              borderRadius: '8px', textAlign: 'center',
              border: '1px solid #378ADD44'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#378ADD' }}>
                {surface_water.total_km2} km²
              </div>
              <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                Total
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ground Water */}
      {ground_water && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: '9px', color: ground_water.color,
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: '6px'
          }}>
            🌍 Ground Water (GLDAS)
          </div>
          <div style={{
            padding: '8px 10px', background: ground_water.color + '22',
            borderRadius: '8px', border: `1px solid ${ground_water.color}44`,
            marginBottom: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#aaa' }}>
                Humidité totale sol (0–200cm)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: ground_water.color }}>
                  {ground_water.total_moisture_kg_m2} kg/m²
                </span>
                <span style={{
                  fontSize: '9px', padding: '2px 6px',
                  borderRadius: '10px',
                  background: ground_water.color + '33',
                  color: ground_water.color, fontWeight: '500'
                }}>
                  {ground_water.level}
                </span>
              </div>
            </div>
          </div>

          {/* Détail par couche */}
          {Object.entries(ground_water.layers).map(([layer, val]) => (
            <div key={layer} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '3px 0', borderBottom: '1px solid #1a1d2644',
              fontSize: '10px'
            }}>
              <span style={{ color: '#666' }}>Profondeur {layer}</span>
              <span style={{ color: '#aaa' }}>{val} kg/m²</span>
            </div>
          ))}
        </div>
      )}

      {/* Sources OSM */}
      {osm && (
        <div>
          <div style={{
            fontSize: '9px', color: '#666',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: '6px'
          }}>
            Sources d'eau (OpenStreetMap)
          </div>

          {osm.rivers?.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', color: '#378ADD', marginBottom: '4px' }}>
                🌊 Oueds et rivières
              </div>
              {osm.rivers.map((r, i) => (
                <div key={i} style={{
                  fontSize: '11px', color: '#aaa',
                  padding: '2px 0', borderBottom: '1px solid #1a1d2644'
                }}>
                  {r}
                </div>
              ))}
            </div>
          )}

          {osm.lakes?.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', color: '#378ADD', marginBottom: '4px' }}>
                🏞️ Lacs et retenues
              </div>
              {osm.lakes.map((l, i) => (
                <div key={i} style={{
                  fontSize: '11px', color: '#aaa',
                  padding: '2px 0', borderBottom: '1px solid #1a1d2644'
                }}>
                  {l}
                </div>
              ))}
            </div>
          )}

          {osm.dams?.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#378ADD', marginBottom: '4px' }}>
                🏗️ Barrages
              </div>
              {osm.dams.map((d, i) => (
                <div key={i} style={{
                  fontSize: '11px', color: '#aaa',
                  padding: '2px 0', borderBottom: '1px solid #1a1d2644'
                }}>
                  {d}
                </div>
              ))}
            </div>
          )}

          {!osm.rivers?.length && !osm.lakes?.length && !osm.dams?.length && (
            <div style={{ fontSize: '11px', color: '#555' }}>
              Aucune source d'eau nommée trouvée
            </div>
          )}
        </div>
      )}

    </div>
  )
}