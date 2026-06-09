export async function fetchClassify(geometry, dateStart, dateEnd) {
  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geometry, dateStart, dateEnd })
    })
    
    console.log('Status classify:', res.status)
    console.log('Headers:', res.headers.get('content-type'))

    const text = await res.text()
    console.log('Response text:', text)

    return JSON.parse(text)

  } catch (err) {
    console.error('fetchClassify error:', err)
    throw err
  }
}

export async function fetchTiles(geometry, index, dateStart, dateEnd) {
  try {
    const res = await fetch('/api/tiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geometry, index, dateStart, dateEnd })
    })

    console.log('Status tiles:', res.status)

    const text = await res.text()
    console.log('Response tiles:', text)

    return JSON.parse(text)

  } catch (err) {
    console.error('fetchTiles error:', err)
    throw err
  }
}

export async function fetchTimeSeries(geometry, index, dateStart, dateEnd) {
  const res = await fetch('/api/timeseries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ geometry, index, dateStart, dateEnd })
  })
  return res.json()
}

export async function fetchWaterAnalysis(geometry, dateStart, dateEnd) {
  const res = await fetch('/api/water-analysis', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ geometry, dateStart, dateEnd })
  })
  return res.json()
}


export async function fetchAllMoroccoAgriHealth(dateStart, dateEnd) {
  const res = await fetch('/api/all-morocco/agri-health', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ dateStart, dateEnd })
  })
  return res.json()
}
export async function fetchAllMoroccoWaterHealth(dateStart, dateEnd) {
  const res = await fetch(
    `/api/layers/water-health?dateStart=${dateStart}&dateEnd=${dateEnd}`
  )
  return res.json()
}

export async function fetchWaterSources(regionName) {
  const res = await fetch(
    `/api/water-sources?region=${encodeURIComponent(regionName)}`
  )
  return res.json()
}

export async function fetchSurfaceWater(geometry, dateStart, dateEnd) {
  const res = await fetch('/api/analysis/surface-water', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ geometry, dateStart, dateEnd })
  })
  return res.json()
}

export async function fetchPrecipitation(geometry, dateStart, dateEnd) {
  const res = await fetch('/api/analysis/precipitation', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ geometry, dateStart, dateEnd })
  })
  return res.json()
}

export async function fetchSurfaceWaterTile(geometry, dateStart, dateEnd) {
  const res = await fetch('/api/analysis/surface-water-tile', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ geometry, dateStart, dateEnd })
  })
  return res.json()
}

export async function fetchPrecipitationTile(geometry, dateStart, dateEnd) {
  const res = await fetch('/api/analysis/precipitation-tile', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ geometry, dateStart, dateEnd })
  })
  return res.json()
}
export async function fetchAllMoroccoPrecipitationTile(dateStart, dateEnd) {
  const res = await fetch('/api/all-morocco/precipitation', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },  
    body   : JSON.stringify({ dateStart, dateEnd })
  })
  return res.json()
}

export async function fetchAllMoroccoSurfaceWaterTile(dateStart, dateEnd) {
  const res = await fetch('/api/all-morocco/surface-water', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },  
    body   : JSON.stringify({ dateStart, dateEnd })
  })
  return res.json()
}