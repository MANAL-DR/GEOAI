import { useState } from 'react'
import WaterPanel from './WaterPanel'

export default function ClassifPanel({ result, waterResult }) {
  const [activeTab, setActiveTab] = useState('agri')

  if (!result && !waterResult) return null

  const { score, label, color, details, values } = result || {}
  const scoreColor = score >= 65 ? '#1D9E75' : score >= 35 ? '#BA7517' : '#D85A30'

  return (
    <div style={{
      background  : '#1a1d26',
      border      : '1px solid #2a2d3a',
      borderRadius: '12px',
      width       : '260px',
      boxShadow   : '0 8px 32px rgba(0,0,0,0.4)',
      overflow    : 'hidden'
    }}>

      {/* Onglets */}
      <div style={{
        display        : 'flex',
        borderBottom   : '1px solid #2a2d3a'
      }}>
        <div
          onClick={() => setActiveTab('agri')}
          style={{
            flex          : 1, padding: '8px',
            textAlign     : 'center',
            fontSize      : '11px', fontWeight: '500',
            cursor        : 'pointer',
            color         : activeTab === 'agri' ? '#1D9E75' : '#666',
            borderBottom  : activeTab === 'agri' ? '2px solid #1D9E75' : '2px solid transparent',
            background    : 'transparent'
          }}>
          Agriculture
        </div>
        <div
          onClick={() => setActiveTab('water')}
          style={{
            flex          : 1, padding: '8px',
            textAlign     : 'center',
            fontSize      : '11px', fontWeight: '500',
            cursor        : 'pointer',
            color         : activeTab === 'water' ? '#378ADD' : '#666',
            borderBottom  : activeTab === 'water' ? '2px solid #378ADD' : '2px solid transparent',
            background    : 'transparent'
          }}>
          Water
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '14px', maxHeight: '420px', overflowY: 'auto' }}>

        {/* Onglet Agriculture */}
        {activeTab === 'agri' && result && (
          <div>
            <div style={{
              display      : 'flex', alignItems: 'center',
              gap          : '12px', marginBottom: '12px'
            }}>
              <div style={{
                width          : '52px', height: '52px',
                borderRadius   : '50%',
                border         : `3px solid ${scoreColor}`,
                display        : 'flex', alignItems: 'center',
                justifyContent : 'center',
                fontSize       : '16px', fontWeight: '600',
                color          : scoreColor
              }}>
                {score}%
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#e8e8e4' }}>
                  {label}
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                  Score agricole global
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #2a2d3a', paddingTop: '10px' }}>
              {Object.entries(details).map(([key, val]) => {
                const c   = val === 2 ? '#1D9E75' : val === 1 ? '#BA7517' : '#D85A30'
                const lbl = val === 2 ? 'Bon' : val === 1 ? 'Modere' : 'Mauvais'
                const rawVal = values[key]
                return (
                  <div key={key} style={{
                    display        : 'flex', alignItems: 'center',
                    justifyContent : 'space-between',
                    padding        : '5px 0',
                    borderBottom   : '1px solid #1a1d26'
                  }}>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>{key}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#666' }}>
                        {rawVal !== undefined ? rawVal.toFixed(3) : '-'}
                      </div>
                      <div style={{
                        fontSize     : '9px', padding: '2px 6px',
                        borderRadius : '10px',
                        background   : c + '22', color: c, fontWeight: '500'
                      }}>
                        {lbl}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'agri' && !result && (
          <div style={{ fontSize: '11px', color: '#555', textAlign: 'center', padding: '20px' }}>
            Lance une analyse pour voir les résultats
          </div>
        )}

        {/* Onglet Water */}
        {activeTab === 'water' && (
          waterResult
            ? <WaterPanel result={waterResult} />
            : (
              <div style={{ fontSize: '11px', color: '#555', textAlign: 'center', padding: '20px' }}>
                Clique sur "Water Analysis" pour analyser les ressources en eau
              </div>
            )
        )}

      </div>
    </div>
  )
}