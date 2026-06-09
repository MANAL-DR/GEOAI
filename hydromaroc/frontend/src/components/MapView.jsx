import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({
  mode, onSelect,
  regionsData, onRegionClick,
  waterSourcesGeoJSON,
  tileUrl              
}) {
  const mapRef            = useRef(null)
  const mapDiv            = useRef(null)
  const marker            = useRef(null)
  const rectLayer         = useRef(null)
  const regionsLayer      = useRef(null)
  const selectedReg       = useRef(null)
  const allMoroccoLayer   = useRef(null)
  const waterSourcesLayer = useRef(null)
  const geeLayer          = useRef(null)  // ← déjà présent

  // Init carte
  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = L.map(mapDiv.current, { center: [31.5, -6.5], zoom: 6 })
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri', maxZoom: 18 }
    ).addTo(mapRef.current)
  }, [])

  // Gérer les modes bin/box/region
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.off('click')
    map.off('mousedown')
    map.off('mousemove')
    map.off('mouseup')
    map.dragging.enable()

    if (marker.current)    { marker.current.remove();    marker.current    = null }
    if (rectLayer.current) { rectLayer.current.remove(); rectLayer.current = null }

    if (mode !== 'region' && regionsLayer.current) {
      map.removeLayer(regionsLayer.current)
      regionsLayer.current = null
      selectedReg.current  = null
    }

    if (mode !== 'allmorocco' && allMoroccoLayer.current) {
      map.removeLayer(allMoroccoLayer.current)
      allMoroccoLayer.current = null
    }

    if (mode === 'bin') {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        if (marker.current) marker.current.remove()
        marker.current = L.circleMarker([lat, lng], {
          radius: 8, fillColor: '#D85A30',
          color: '#fff', weight: 2, fillOpacity: 1
        }).addTo(map)
        onSelect({ type: 'Point', coordinates: [lng, lat] })
      })
    }

    if (mode === 'box') {
      let startLatLng = null
      let isDragging  = false
      map.on('mousedown', (e) => {
        map.dragging.disable()
        startLatLng = e.latlng
        isDragging  = true
        if (rectLayer.current) { rectLayer.current.remove(); rectLayer.current = null }
      })
      map.on('mousemove', (e) => {
        if (!isDragging || !startLatLng) return
        if (rectLayer.current) rectLayer.current.remove()
        rectLayer.current = L.rectangle(
          [startLatLng, e.latlng],
          { color: '#BA7517', weight: 2, fillColor: '#BA7517', fillOpacity: 0.15 }
        ).addTo(map)
      })
      map.on('mouseup', (e) => {
        if (!isDragging || !startLatLng) return
        isDragging = false
        map.dragging.enable()
        const end    = e.latlng
        const minLat = Math.min(startLatLng.lat, end.lat)
        const maxLat = Math.max(startLatLng.lat, end.lat)
        const minLng = Math.min(startLatLng.lng, end.lng)
        const maxLng = Math.max(startLatLng.lng, end.lng)
        onSelect({
          type: 'Polygon',
          coordinates: [[
            [minLng, minLat], [maxLng, minLat],
            [maxLng, maxLat], [minLng, maxLat],
            [minLng, minLat]
          ]]
        })
        startLatLng = null
      })
    }

    if (mode === 'region') {
      fetch('/data/maroc_regions.geojson')
        .then(r => r.json())
        .then(data => {
          regionsLayer.current = L.geoJSON(data, {
            style: {
              color: '#378ADD', weight: 2,
              fillColor: '#1a3a5c', fillOpacity: 0.3
            },
            onEachFeature: (feature, layer) => {
              const nom = feature.properties.NAME_1 || 'Region'
              layer.bindTooltip(nom, {
                permanent: true, direction: 'center', className: 'region-label'
              })
              layer.on('mouseover', () => {
                if (selectedReg.current !== layer)
                  layer.setStyle({ fillOpacity: 0.5, fillColor: '#378ADD' })
              })
              layer.on('mouseout', () => {
                if (selectedReg.current !== layer)
                  layer.setStyle({ fillOpacity: 0.3, fillColor: '#1a3a5c' })
              })
              layer.on('click', () => {
                if (selectedReg.current)
                  selectedReg.current.setStyle({ fillOpacity: 0.3, fillColor: '#1a3a5c', color: '#378ADD' })
                layer.setStyle({ fillOpacity: 0.5, fillColor: '#1D9E75', color: '#1D9E75' })
                selectedReg.current = layer
                onSelect(feature.geometry, feature.properties.NAME_1)
              })
            }
          }).addTo(map)
        })
    }

    return () => {
      map.off('click')
      map.off('mousedown')
      map.off('mousemove')
      map.off('mouseup')
      map.dragging.enable()
    }
  }, [mode, onSelect])

  // AllMorocco — afficher régions colorées
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (allMoroccoLayer.current) {
      map.removeLayer(allMoroccoLayer.current)
      allMoroccoLayer.current = null
    }

    if (mode !== 'allmorocco' || !regionsData) return

    allMoroccoLayer.current = L.geoJSON(
      {
        type: 'FeatureCollection',
        features: regionsData.map(r => ({
          type: 'Feature',
          geometry: r.geometry,
          properties: r
        }))
      },
      {
        style: (feature) => ({
          color      : '#ffffff44',
          weight     : 1,
          fillColor  : feature.properties.color || '#2a2d3a',
          fillOpacity: 0.7
        }),
        onEachFeature: (feature, layer) => {
          const props = feature.properties
          const score = props.score !== undefined ? `${props.score}` : '—'
          layer.bindTooltip(
            `<b>${props.name}</b><br/>${props.label || ''}`,
        { direction: 'center', className: 'region-label' }
          )
          layer.on('click', () => {
            if (onRegionClick) {
              onRegionClick({
                geometry: feature.geometry,
                name    : props.name,
                color   : props.color
              })
            }
          })
        }
      }
    ).addTo(map)

  }, [mode, regionsData])

  // Water Sources — afficher les sources d'eau
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (waterSourcesLayer.current) {
      map.removeLayer(waterSourcesLayer.current)
      waterSourcesLayer.current = null
    }

    if (!waterSourcesGeoJSON) return

    waterSourcesLayer.current = L.geoJSON(waterSourcesGeoJSON, {
      style: (feature) => ({
        color      : feature.properties.color  || '#1565C0',
        weight     : feature.properties.weight || 2,
        opacity    : 0.9,
        fillColor  : feature.properties.color  || '#1E88E5',
        fillOpacity: 0.4
      }),
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius     : 5,
          fillColor  : feature.properties.color || '#00ACC1',
          color      : '#fff',
          weight     : 1.5,
          fillOpacity: 1
        })
      },
      onEachFeature: (feature, layer) => {
        const { name, label, color } = feature.properties
        layer.bindPopup(`
          <div style="font-family:sans-serif;min-width:130px">
            <b style="font-size:13px">${name}</b><br/>
            <span style="
              display:inline-block;margin-top:4px;padding:2px 7px;
              border-radius:10px;background:${color}22;
              color:${color};font-size:10px;font-weight:600
            ">${label}</span>
          </div>
        `)
        layer.on('mouseover', () => layer.openPopup())
      }
    }).addTo(map)

    if (waterSourcesLayer.current.getBounds().isValid()) {
      map.fitBounds(waterSourcesLayer.current.getBounds(), { padding: [40, 40] })
    }

  }, [waterSourcesGeoJSON])

  // ── NOUVEAU — Tile GEE (Surface Water / Precipitation) ──────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Supprimer l'ancien layer
    if (geeLayer.current) {
      map.removeLayer(geeLayer.current)
      geeLayer.current = null
    }
    if (!tileUrl) return
    if (selectedReg.current) {
    selectedReg.current.setStyle({
      fillOpacity: 0.05,  // presque transparent
      color      : '#1D9E75',
      weight     : 2
    })
  }
    // Ajouter le nouveau layer
    geeLayer.current = L.tileLayer(tileUrl, {
      opacity: 0.8,
      maxZoom: 18
    }).addTo(map)

  }, [tileUrl])   // ← se déclenche chaque fois que tileUrl change

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapDiv} style={{ width: '100%', height: '100%' }} />

      {mode === 'box' && (
        <div style={{
          position: 'absolute', top: '10px', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1d26cc', border: '1px solid #BA7517',
          borderRadius: '8px', padding: '6px 16px',
          fontSize: '11px', color: '#BA7517',
          zIndex: 1000, pointerEvents: 'none'
        }}>
          Cliquer et glisser pour dessiner la zone
        </div>
      )}

      {mode === 'region' && (
        <div style={{
          position: 'absolute', top: '10px', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1d26cc', border: '1px solid #378ADD',
          borderRadius: '8px', padding: '6px 16px',
          fontSize: '11px', color: '#378ADD',
          zIndex: 1000, pointerEvents: 'none'
        }}>
          Cliquer sur une region pour la selectionner
        </div>
      )}
    </div>
  )
}