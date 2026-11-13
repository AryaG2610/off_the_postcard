import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from 'react-simple-maps';
import worldMap from 'world-atlas/land-110m.json';
import './styles.css';

const STATUSES = [['dreaming', 'Dreaming'], ['planning', 'Planning'], ['booked', 'Booked'], ['been', 'Been there']];
const MOODS = [['sea', 'Sea and beach'], ['hike', 'Hiking'], ['road', 'Road trip'], ['culture', 'Culture'], ['food', 'Food']];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_LETTERS = 'JFMAMJJASOND'.split('');
const TIER_LABELS = { L: 'Cheaper / shoulder', M: 'Middle', P: 'Peak' };
const WEATHER_LABELS = { G: 'Sun: drier / warmer', O: 'Rain: wetter / humid', R: 'Rain/storm: wetter', S: 'Snow: colder / wintry' };
const WEATHER_GLYPHS = { G: '☀', O: '☔', R: '☔', S: '❄' };
const CORE_STARTER = [];
const ADDITIONAL_STARTER = [];
const STARTER = [];

const SOURCE_GUIDANCE = {};

const SEASON_PROFILES = {};

Object.entries(SEASON_PROFILES).forEach(([id, [pricePattern, weatherPattern, dryLabel, shoulderLabel, wetLabel]]) => {
  const destination = [...CORE_STARTER, ...ADDITIONAL_STARTER].find((item) => item.id === id);
  if (destination) destination.seasonProfile = {
    sourced: false,
    monthLevelSupported: false,
    sourceType: 'broad climate guidance',
    pricePattern,
    weatherPattern,
    labels: { L: 'Cheaper / shoulder', M: 'Middle', P: 'Peak' },
    seasonLabels: { D: dryLabel, S: shoulderLabel, W: wetLabel }
  };
});

Object.entries(SOURCE_GUIDANCE).forEach(([id, [summary, url, caveat]]) => {
  const destination = [...CORE_STARTER, ...ADDITIONAL_STARTER].find((item) => item.id === id);
  if (destination) destination.sourceGuidance = { summary, url, caveat };
});

const CLIMATE_SOURCES = {};

Object.entries(CLIMATE_SOURCES).forEach(([id, [label, url]]) => {
  const destination = [...CORE_STARTER, ...ADDITIONAL_STARTER].find((item) => item.id === id);
  if (destination?.sourceGuidance) {
    destination.sourceGuidance = {
      ...destination.sourceGuidance,
      version: 2,
      url,
      sourceLabel: label,
      fallbackUrl: `https://www.google.com/search?q=${encodeURIComponent(`${destination.name} climate weather`)}`,
      sourceNote: url.includes('weatherspark.com/search')
        ? 'This is a live climate search page; choose the closest city or region for the destination.'
        : 'This source was selected because it is a stable climate or park-weather reference.'
    };
  }
});

const STARTER_CONTENT = {};

Object.entries(STARTER_CONTENT).forEach(([id, content]) => {
  const destination = ADDITIONAL_STARTER.find((item) => item.id === id);
  if (destination) Object.assign(destination, content);
});

const formatDateForApi = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildMonthlyWeatherPattern = (monthlyStats) => {
  return MONTHS.map((_, index) => {
    const month = monthlyStats[index];
    if (!month) return 'M';
    const { avgTemp, precip } = month;
    if (avgTemp < 2) return 'S';
    if (precip > 140) return 'O';
    if (avgTemp >= 20 && precip < 80) return 'G';
    if (avgTemp >= 15 && precip < 110) return 'G';
    return 'M';
  }).join('');
};

const buildMonthlyPricePattern = (monthlyStats) => {
  return MONTHS.map((_, index) => {
    const month = monthlyStats[index];
    if (!month) return 'M';
    const { avgTemp, precip } = month;
    const comfortScore = (avgTemp >= 18 && avgTemp <= 28 ? 2 : avgTemp >= 10 && avgTemp <= 30 ? 1 : 0) - (precip > 120 ? 1 : precip > 80 ? 0.5 : 0);
    if (comfortScore >= 1.5) return 'L';
    if (comfortScore <= 0) return 'P';
    return 'M';
  }).join('');
};

const buildWhenText = (monthlyStats) => {
  const ranked = monthlyStats.map((month, index) => ({ ...month, monthIndex: index })).filter((month) => month && Number.isFinite(month.avgTemp) && Number.isFinite(month.precip)).sort((a, b) => (b.avgTemp - b.precip * 0.08) - (a.avgTemp - a.precip * 0.08));
  const best = ranked.slice(0, 3).map((month) => MONTHS[month.monthIndex]);
  const likelyBest = best.length ? best.join(', ') : 'the coming shoulder seasons';
  return `Based on the last 12 months of local weather, the best travel window is generally ${likelyBest}. This is a live climate estimate from the selected coordinates, not a static editorial guess.`;
};

const monthlyWeatherSummary = async (destination) => {
  const lat = Number(destination.lat);
  const lon = Number(destination.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(end.getFullYear() - 1);
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${formatDateForApi(start)}&end_date=${formatDateForApi(end)}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const times = data.daily?.time || [];
  const temps = data.daily?.temperature_2m_mean || [];
  const rain = data.daily?.precipitation_sum || [];
  const monthlyStats = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthEntries = times
      .map((value, index) => ({ value, temp: temps[index], precip: rain[index] }))
      .filter(({ value }) => {
        const date = new Date(value);
        return !Number.isNaN(date.getTime()) && date.getMonth() === monthIndex;
      });
    if (!monthEntries.length) return null;
    const avgTemp = monthEntries.reduce((sum, entry) => sum + (Number(entry.temp) || 0), 0) / monthEntries.length;
    const precip = monthEntries.reduce((sum, entry) => sum + (Number(entry.precip) || 0), 0);
    return { avgTemp, precip };
  });
  const pricePattern = buildMonthlyPricePattern(monthlyStats);
  const weatherPattern = buildMonthlyWeatherPattern(monthlyStats);
  const when = buildWhenText(monthlyStats);
  return {
    tiers: pricePattern,
    wx: weatherPattern,
    when,
    sourceGuidance: {
      summary: when,
      url: 'https://open-meteo.com/en/docs',
      caveat: 'Live climate data based on the selected coordinates and the previous 12 months of local weather.',
      version: 2,
      sourceLabel: 'Live climate data',
      fallbackUrl: `https://www.google.com/search?q=${encodeURIComponent(`${destination.name || 'destination'} climate weather`)}`
    },
    seasonProfile: {
      sourced: true,
      monthLevelSupported: true,
      sourceType: 'live weather archive',
      pricePattern,
      weatherPattern,
      labels: { L: 'Cheaper / shoulder', M: 'Middle', P: 'Peak' },
      seasonLabels: { D: 'Dryer / lower price', S: 'Shoulder / balanced', W: 'Wetter / higher price' }
    },
    sourceLinks: [{ label: 'Open-Meteo climate archive', url: 'https://open-meteo.com/en/docs' }]
  };
};

const seasonalDefaults = (destination) => {
  const southern = destination.lat < -8;
  const tropical = Math.abs(destination.lat) < 23.5;
  if (tropical) return {
    tiers: 'LLMMPPLLLMML',
    wx: southern ? 'GGGGOORRRROG' : 'RRGGOOGGGGOR',
    when: 'May to October is a useful starting window, but rainfall and marine conditions vary by coast and island.'
  };
  return {
    tiers: southern ? 'LLMMPPLLLMML' : 'LLMMPPLLLMML',
    wx: southern ? 'GGGGOORRRROG' : 'RRGGOOGGGGOR',
    when: southern
      ? 'October to April is often the warmer travel window; check local weather and access conditions for the region.'
      : 'April to June or September to October often balance comfortable weather and lower crowds; check local conditions.'
  };
};

const buildSeasonPlan = (destination) => {
  const defaults = seasonalDefaults(destination);
  return {
    ...defaults,
    seasonProfile: {
      sourced: false,
      monthLevelSupported: false,
      sourceType: 'broad climate guidance',
      pricePattern: defaults.tiers,
      weatherPattern: defaults.wx,
      labels: { L: 'Cheaper / shoulder', M: 'Middle', P: 'Peak' },
      seasonLabels: { D: 'Dryer / lower price', S: 'Shoulder / balanced', W: 'Wetter / higher price' }
    }
  };
};

const resolveClimateProfile = async (destination) => {
  try {
    const live = await monthlyWeatherSummary(destination);
    if (live) return live;
  } catch (error) {
    console.warn('Could not fetch live climate profile for this destination.', error);
  }
  return buildSeasonPlan(destination);
};

ADDITIONAL_STARTER.forEach((destination) => {
  const defaults = seasonalDefaults(destination);
  destination.tiers ||= defaults.tiers;
  destination.wx ||= defaults.wx;
  destination.when ||= defaults.when;
});

const clone = (value) => JSON.parse(JSON.stringify(value));
const coords = (lat, lon) => `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`;
const emptySpot = (text) => ({ text, done: false });
const normalized = (item) => {
  const country = item.country ?? item.region ?? '';
  return { ...item, country, region: country, spots: (item.spots || []).map((s) => typeof s === 'string' ? emptySpot(s) : s), days: item.days || [], photos: item.photos || [], tiers: item.tiers || '', wx: item.seasonProfile?.weatherPattern || item.wx || '', seasonProfile: item.seasonProfile || null, sourceLinks: item.sourceLinks || [], sourceGuidance: item.sourceGuidance || null };
};
const isRenderableDestination = (item) => item && typeof item.name === 'string' && item.name.trim().length > 0;
const haversine = (a, b) => {
  const radius = 3958.8, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
const routeDistance = (route = []) => route.slice(1).reduce((total, point, index) => total + haversine(route[index], point), 0);
const routeTime = (route = []) => Math.max(0, routeDistance(route) / 48);
const formatDuration = (hours) => `${Math.floor(hours)} hr ${Math.round((hours % 1) * 60)} min`;
const monthsForPattern = (pattern, code) => MONTHS.filter((_, index) => pattern?.[index] === code);
const budgetSummary = (destination) => {
  const pattern = destination.seasonProfile?.pricePattern || destination.tiers;
  const months = monthsForPattern(pattern, 'L');
  if (!months.length) return 'No budget planning estimate yet. Use the climate guidance above and check current fares.';
  return `Budget planning starting point: ${months.join(', ')}. Green is an editorial shoulder-season estimate, not a live fare or verified demand measurement; compare current flights and lodging before booking.`;
};
const loadDestinations = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('off-the-postcard-v2'))?.dests;
    if (!Array.isArray(stored)) return STARTER.map(normalized);
    const validStored = stored.filter(isRenderableDestination);
    const starterById = new Map(STARTER.map((item) => [item.id, item]));
    const mergeMissing = (item) => {
      const starter = starterById.get(item.id);
      if (!starter) return normalized(item);
      const current = normalized(item);
      return normalized({
        ...starter,
        ...current,
        spots: current.spots.length ? current.spots : starter.spots,
        days: current.days.length ? current.days : starter.days,
        tiers: current.tiers || starter.tiers,
        wx: current.wx || starter.wx,
        when: current.when || starter.when,
        note: current.note || starter.note,
        sourceLinks: current.sourceLinks?.length ? current.sourceLinks : starter.sourceLinks,
        sourceGuidance: current.sourceGuidance?.version === 2 ? current.sourceGuidance : starter.sourceGuidance,
        seasonProfile: current.seasonProfile?.monthLevelSupported ? current.seasonProfile : starter.seasonProfile,
        tags: current.tags?.length ? current.tags : starter.tags
      });
    };
    const storedIds = new Set(validStored.map((item) => item.id));
    return [...validStored.map(mergeMissing), ...STARTER.filter((item) => !storedIds.has(item.id)).map(normalized)];
  } catch {
    return STARTER.map(normalized);
  }
};

function MapView({ destinations, selectedId, onSelect, addMode = false, route, selectedStop = null, onStopSelect }) {
  const [position, setPosition] = useState({ coordinates: [0, 15], zoom: 1 });
  const routePoints = route || [];
  const focus = routePoints.length ? [routePoints.reduce((sum, p) => sum + p[1], 0) / routePoints.length, routePoints.reduce((sum, p) => sum + p[0], 0) / routePoints.length] : [0, 15];
  const longitudeSpread = routePoints.length > 1 ? Math.max(...routePoints.map((point) => point[1])) - Math.min(...routePoints.map((point) => point[1])) : 20;
  const latitudeSpread = routePoints.length > 1 ? Math.max(...routePoints.map((point) => point[0])) - Math.min(...routePoints.map((point) => point[0])) : 15;
  const longitudeRadians = Math.max(0.08, longitudeSpread * Math.PI / 180);
  const latitudeRadians = Math.max(0.08, latitudeSpread * Math.PI / 180);
  const routeScale = Math.round(Math.min(4200, Math.max(360, 720 / Math.max(longitudeRadians, latitudeRadians * 1.35))));
  const routeHeight = Math.round(Math.min(680, Math.max(440, 420 + latitudeSpread * 10)));
  const mapContent = <><Geographies geography={worldMap}>{({ geographies }) => geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} className="geography" />)}</Geographies>
      {routePoints.length > 1 && routePoints.slice(1).map((point, index) => <Line key={`route-${index}`} from={[routePoints[index][1], routePoints[index][0]]} to={[point[1], point[0]]} className="route-line" />)}
      {routePoints.map((point, index) => <Marker key={`route-stop-${index}`} coordinates={[point[1], point[0]]} onClick={() => onStopSelect?.(index)}>
        <circle className="route-hit-area" r={24} aria-label={`Select stop ${index + 1}`} />
        <circle className={`route-marker ${selectedStop === index ? 'selected' : ''}`} r={selectedStop === index ? 17 : 15} />
        <text className="route-number" y="6" textAnchor="middle">{index + 1}</text>
      </Marker>)}
      {!routePoints.length && destinations.map((d) => <Marker key={d.id} coordinates={[d.lon, d.lat]} onClick={() => onSelect(d.id)}><circle className={`destination-marker ${d.id === selectedId ? 'selected' : ''}`} style={{ '--c': `var(--${d.status})` }} r={d.id === selectedId ? 7 : 5} /><title>{d.name} · {d.country}</title>{d.id === selectedId && <text className="destination-label" x={d.lon > 20 ? -10 : 10} y="5" textAnchor={d.lon > 20 ? 'end' : 'start'}>{d.name}</text>}</Marker>)}</>;
  return <div className={`map-shell ${addMode ? 'map-add-mode' : ''} ${routePoints.length ? 'route-map-static' : ''}`} style={routePoints.length ? { '--route-height': `${routeHeight}px` } : undefined}><ComposableMap projection="geoMercator" projectionConfig={routePoints.length ? { scale: routeScale, center: focus } : { scale: 145 }} width={1000} height={routePoints.length ? routeHeight : 440}>
    {routePoints.length ? mapContent : <ZoomableGroup center={position.coordinates} zoom={position.zoom} onMoveEnd={setPosition} minZoom={1} maxZoom={8}>
      {mapContent}
    </ZoomableGroup>}
  </ComposableMap>{!routePoints.length && <p className="map-help">Drag to pan. Scroll or pinch to zoom. Markers stay compact to keep the world map readable; select a place from the index or click a marker for its label.</p>}</div>;
}

function App() {
  const [destinations, setDestinations] = useState(loadDestinations);
  const [selectedId, setSelectedId] = useState(() => destinations[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [placeLookupStatus, setPlaceLookupStatus] = useState({ type: 'idle', message: '' });
  const [theme, setTheme] = useState(() => localStorage.getItem('off-the-postcard-theme') || 'light');
  const fileInput = useRef(null);
  const placeSearchTimeout = useRef(null);
  const selected = destinations.find((d) => d.id === selectedId);

  useEffect(() => { localStorage.setItem('off-the-postcard-v2', JSON.stringify({ dests: destinations })); }, [destinations]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('off-the-postcard-theme', theme); }, [theme]);

  const updateSelected = (patch) => setDestinations((items) => items.map((d) => d.id === selectedId ? { ...d, ...patch } : d));
  const filtered = useMemo(() => destinations.filter((d) => (statusFilter === 'all' || d.status === statusFilter) && (moodFilter === 'all' || d.tags.includes(moodFilter))), [destinations, statusFilter, moodFilter]);
  const taken = destinations.filter((d) => d.status === 'been').length;
  const extractCountry = (place) => {
    const country = place?.address?.country || place?.address?.country_name;
    if (country) return country.trim();
    const displayName = String(place?.display_name || '').trim();
    const parts = displayName.split(',').map((part) => part.trim()).filter(Boolean);
    return parts[parts.length - 1] || place?.name || '';
  };
  const applyPlaceSelection = (place) => {
    const form = document.querySelector('.draft');
    const placeName = place?.address?.city || place?.address?.town || place?.address?.village || place?.name || String(place?.display_name || '').split(',')[0].trim();
    const country = extractCountry(place);
    if (form) {
      form.elements.name.value = placeName;
      form.elements.country.value = country;
      form.elements.lat.value = place.lat;
      form.elements.lon.value = place.lon;
    }
    setPlaceSuggestions([]);
    setPlaceLookupStatus({ type: 'success', message: `Filled from ${country}.` });
  };
  const lookupPlace = async (query) => {
    const name = String(query || '').trim();
    if (!name) {
      setPlaceSuggestions([]);
      setPlaceLookupStatus({ type: 'idle', message: '' });
      return;
    }
    try {
      setPlaceLookupStatus({ type: 'loading', message: 'Looking up place…' });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=en&q=${encodeURIComponent(name)}`);
      const results = await response.json();
      const suggestions = (results || []).map((place) => ({
        id: place.place_id,
        label: place.display_name,
        name: place.name || place.address?.city || place.address?.town || place.address?.village || String(place.display_name || '').split(',')[0].trim(),
        country: extractCountry(place),
        lat: Number(place.lat),
        lon: Number(place.lon)
      }));
      setPlaceSuggestions(suggestions);
      if (!suggestions.length) {
        setPlaceLookupStatus({ type: 'error', message: 'No matches found.' });
      } else {
        setPlaceLookupStatus({ type: 'idle', message: '' });
      }
    } catch (error) {
      setPlaceSuggestions([]);
      setPlaceLookupStatus({ type: 'error', message: 'Place lookup failed. Try a more specific name.' });
    }
  };
  const handlePlaceInput = (event) => {
    const nextValue = event.target.value;
    if (placeSearchTimeout.current) clearTimeout(placeSearchTimeout.current);
    if (!nextValue.trim()) {
      setPlaceSuggestions([]);
      setPlaceLookupStatus({ type: 'idle', message: '' });
      return;
    }
    placeSearchTimeout.current = setTimeout(() => lookupPlace(nextValue), 250);
  };
  const createDraft = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (!name) return;
    const type = form.get('type') === 'road' ? 'road' : 'place';
    const lat = Number(form.get('lat') || 0), lon = Number(form.get('lon') || 0);
    const country = String(form.get('country') || '').trim();
    const seasonal = await resolveClimateProfile({ lat, lon, name, country, type });
    const next = normalized({ id: `p${Date.now().toString(36)}`, name, country, type, lat, lon, status: 'dreaming', tags: type === 'road' ? ['road'] : [], spots: [], days: [], photos: [], route: type === 'road' ? [[lat, lon]] : [], ...seasonal });
    setDestinations((items) => [...items, next]); setSelectedId(next.id); setAddOpen(false); setPlaceLookupStatus({ type: 'idle', message: '' });
  };
  const changeField = (field, value) => updateSelected({ [field]: value });
  const addSpot = (event) => { event.preventDefault(); const input = event.currentTarget.elements.spot; if (input.value.trim()) { updateSelected({ spots: [...selected.spots, emptySpot(input.value.trim())] }); input.value = ''; } };
  const addDay = () => updateSelected({ days: [...selected.days, `Day ${selected.days.length + 1} · `] });
  const cycleMonth = (field, index) => {
    const cycle = field === 'tiers' ? '-LMP' : '-GOR', chars = Array.from((selected[field] || '').padEnd(12, '-')).slice(0, 12);
    chars[index] = cycle[(cycle.indexOf(chars[index]) + 1) % cycle.length]; updateSelected({ [field]: chars.join('') });
  };
  const addPhotos = (event) => {
    const files = Array.from(event.target.files || []);
    const next = files.map((file) => ({ id: `${Date.now()}-${file.name}`, url: URL.createObjectURL(file), name: file.name }));
    updateSelected({ photos: [...(selected.photos || []), ...next] }); event.target.value = '';
  };
  const removeSelected = () => { const rest = destinations.filter((d) => d.id !== selectedId); setDestinations(rest); setSelectedId(rest[0]?.id || null); };

  return <div className="wrap">
    <header className="mast"><div><p className="kicker">Field notebook for slow travel</p><h1>Off the Postcard</h1><p className="thesis">Places I want to understand, not just visit.</p></div><div className="mast-actions"><button className="btn ghost sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light paper' : 'Dark paper'}</button><div className="stamp" aria-label={`${taken} of ${destinations.length} trips taken`}><span className="stamp-n">{taken}<i>/{destinations.length}</i></span><span className="stamp-l">trips taken</span></div></div></header>
    <section aria-label="World map"><div className="plate"><MapView destinations={destinations} selectedId={selectedId} onSelect={setSelectedId} /></div><div className="map-actions"><button className="btn sm" onClick={() => setAddOpen(true)}>＋ Add destination or trip</button></div>{addOpen && <form key={selected?.id ?? 'new-destination'} className="draft" onSubmit={createDraft}><label>Name<div className="place-search-wrap"><input name="name" required autoFocus placeholder="e.g. Kyoto, Japan" onChange={handlePlaceInput} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); const value = String(event.currentTarget.value || '').trim(); if (value) { lookupPlace(value); } } }} /><ul className="place-suggestions">{placeSuggestions.map((suggestion) => <li key={suggestion.id}><button type="button" onClick={() => applyPlaceSelection({ ...suggestion, name: suggestion.name, address: { country: suggestion.country }, display_name: suggestion.label, lat: suggestion.lat, lon: suggestion.lon })}>{suggestion.label}</button></li>)}</ul></div></label><label>Country<input name="country" defaultValue="" /></label><label>Type<select name="type" defaultValue="place"><option value="place">Place</option><option value="road">Road trip</option></select></label><label>Latitude<input name="lat" type="number" step="any" min="-90" max="90" defaultValue="" /></label><label>Longitude<input name="lon" type="number" step="any" min="-180" max="180" defaultValue="" /></label>{placeLookupStatus.message && <p className={`lookup-status ${placeLookupStatus.type}`}>{placeLookupStatus.message}</p>}<button className="btn sm" type="submit">Add to notebook</button><button type="button" className="btn ghost sm" onClick={() => { setAddOpen(false); setPlaceLookupStatus({ type: 'idle', message: '' }); setPlaceSuggestions([]); }}>Cancel</button></form>}</section>
    <div className={`grid ${selected ? 'has-selection' : ''}`}><nav className="index"><div className="index-heading"><h2>Places index</h2><button className="btn ghost sm filter-toggle" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>Filters</button></div>{filtersOpen && <div className="filter-panel"><p className="flabel">Status</p><div className="chips">{[['all','All'],...STATUSES].map(([key,label]) => <button key={key} className="chip" aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>{key !== 'all' && <span className="dotc" style={{ '--c': `var(--${key})` }} />}{label} {key === 'all' ? destinations.length : destinations.filter((d) => d.status === key).length}</button>)}</div><p className="flabel">Type</p><div className="chips">{[['all','All types'],...MOODS].map(([key,label]) => <button key={key} className="chip" aria-pressed={moodFilter === key} onClick={() => setMoodFilter(key)}>{label} {key === 'all' ? destinations.length : destinations.filter((d) => d.tags.includes(key)).length}</button>)}</div></div>}<div className="index-list"><ul className="rows">{filtered.length ? filtered.map((d) => <li key={d.id}><button className="row" aria-current={d.id === selectedId} onClick={() => setSelectedId(d.id)}><span className="dotc" style={{ '--c': `var(--${d.status})` }} /><span><span className="nm">{d.name}</span><span className="rg">{d.country}{d.type === 'road' ? ' · road trip' : ''}</span></span><span className="pr">{d.spots.filter((s) => s.done).length}/{d.spots.length}</span></button></li>) : <li className="none">Nothing matches these filters.</li>}</ul></div></nav>
      <main className="page">{selected ? <Destination key={selected.id} d={selected} onField={changeField} onSpot={updateSelected} onAddSpot={addSpot} onAddDay={addDay} onCycle={cycleMonth} onPhotos={addPhotos} fileInput={fileInput} onRemove={removeSelected} /> : <p className="empty">No places yet. Use Add destination or trip to create your first one.</p>}</main>
    </div>
  </div>;
}

function RouteEditor({ d, onField, onCancel, onSaved }) {
  const [draft, setDraft] = useState(() => (d.route || []).map((point, index) => ({
    name: d.routeNames?.[index] || `Stop ${index + 1}`,
    lat: point[0],
    lon: point[1]
  })));
  const [savedRoute, setSavedRoute] = useState(() => JSON.stringify(draft));

  useEffect(() => {
    const next = (d.route || []).map((point, index) => ({
      name: d.routeNames?.[index] || `Stop ${index + 1}`,
      lat: point[0],
      lon: point[1]
    }));
    setDraft(next);
    setSavedRoute(JSON.stringify(next));
  }, [d.route, d.routeNames]);

  const updateStop = (index, field, value) => {
    setDraft((items) => items.map((stop, stopIndex) => stopIndex === index ? { ...stop, [field]: value } : stop));
  };
  const moveStop = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.length) return;
    setDraft((items) => {
      const next = [...items];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };
  const removeStop = (index) => setDraft((items) => items.filter((_, stopIndex) => stopIndex !== index));
  const addStop = () => setDraft((items) => [...items, { name: `Stop ${items.length + 1}`, lat: 0, lon: 0 }]);
  const submit = (event) => {
    event.preventDefault();
    const route = draft.map((stop) => [Number(stop.lat), Number(stop.lon)]);
    const routeNames = draft.map((stop, index) => String(stop.name || '').trim() || `Stop ${index + 1}`);
    onField('route', route);
    onField('routeNames', routeNames);
    setSavedRoute(JSON.stringify(draft));
    onSaved?.();
  };
  const isDirty = JSON.stringify(draft) !== savedRoute;

  return <form className="route-editor" onSubmit={submit}>
    <div className="route-editor-heading"><div><strong>Edit route stops</strong><p>Add, remove, rename, or reorder stops. Save changes to update the route overview.</p></div><button type="button" className="btn ghost sm" onClick={addStop}>＋ Add stop</button></div>
    <ol className="route-editor-list">{draft.map((stop, index) => <li className="route-editor-stop" key={index}>
      <span className="num">{index + 1}</span>
      <label>Stop name<input value={stop.name} onChange={(event) => updateStop(index, 'name', event.target.value)} /></label>
      <label>Latitude<input type="number" step="0.01" min="-90" max="90" value={stop.lat} onChange={(event) => updateStop(index, 'lat', event.target.value)} /></label>
      <label>Longitude<input type="number" step="0.01" min="-180" max="180" value={stop.lon} onChange={(event) => updateStop(index, 'lon', event.target.value)} /></label>
      <div className="route-editor-actions"><button type="button" className="icon-btn" onClick={() => moveStop(index, -1)} disabled={index === 0} aria-label={`Move ${stop.name} up`}>↑</button><button type="button" className="icon-btn" onClick={() => moveStop(index, 1)} disabled={index === draft.length - 1} aria-label={`Move ${stop.name} down`}>↓</button><button type="button" className="icon-btn danger" onClick={() => removeStop(index)} aria-label={`Delete ${stop.name}`}>×</button></div>
    </li>)}</ol>
    {!draft.length && <p className="empty-note">No stops yet. Add the first stop to begin the route.</p>}
    <div className="route-editor-footer"><button className="btn sm" type="submit" disabled={!isDirty}>Save route changes</button><button type="button" className="btn ghost sm" onClick={onCancel}>Cancel</button>{isDirty && <span className="route-editor-dirty">Unsaved route changes</span>}</div>
  </form>;
}

function RoutePreview({ d }) {
  const [selectedStop, setSelectedStop] = useState(0);
  const distance = routeDistance(d.route);
  const stopName = d.routeNames?.[selectedStop] || `Stop ${selectedStop + 1}`;
  const stopPoint = d.route?.[selectedStop];
  return <div className="route-preview"><MapView destinations={[]} selectedId={null} onSelect={() => {}} route={d.route} selectedStop={selectedStop} onStopSelect={setSelectedStop} /><div className="route-stop-detail"><strong>Stop {selectedStop + 1}: {stopName}</strong>{stopPoint && <span>{coords(stopPoint[0], stopPoint[1])}</span>}</div><div className="route-summary"><strong>{d.route?.length || 0} stops</strong><span>≈ {Math.round(distance).toLocaleString()} mi</span><span>≈ {formatDuration(routeTime(d.route))} driving time</span></div><p className="route-help">Click a numbered stop to see its name and coordinates. Distance and time are a key-free estimate based on straight-line segments at an average 48 mph. Actual roads, traffic, and stops will vary.</p></div>;
}

function Destination({ d, onField, onSpot, onAddSpot, onAddDay, onCycle, onPhotos, fileInput, onRemove }) {
  const [confirm, setConfirm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(false);
  useEffect(() => { setConfirm(false); }, [d.id]);
  const toggleTag = (tag) => onField('tags', d.tags.includes(tag) ? d.tags.filter((t) => t !== tag) : [...d.tags, tag]);
  return <><header className="destination-header"><div><p className="eyebrow">{d.country} · {coords(d.lat, d.lon)}</p><h2><span className="hl">{d.name}</span></h2></div><div className="remove-wrap"><button className="link" onClick={() => setConfirm(true)}>Remove this {d.type === 'road' ? 'road trip' : 'place'}</button>{confirm && <span className="remove-confirm">Remove it for good? <button className="link danger" onClick={onRemove}>Yes, remove</button> <button className="link" onClick={() => setConfirm(false)}>Keep it</button></span>}</div></header>
    <div className="seg">{STATUSES.map(([key,label]) => <button key={key} className="st" style={{ '--c': `var(--${key})` }} aria-pressed={d.status === key} onClick={() => onField('status', key)}>{label}</button>)}</div>
    <section><h3>Photos</h3><div className="photos">{(d.photos || []).map((photo) => <figure className="ph" key={photo.id}><img src={photo.url} alt={`Photo of ${d.name}`} /><button className="x" onClick={() => onField('photos', d.photos.filter((p) => p.id !== photo.id))}>Remove</button></figure>)}<label className="addph" htmlFor="photo-input"><b>Add photos</b><span>Trips you took, or places that inspire you</span></label><input ref={fileInput} id="photo-input" className="sr" type="file" accept="image/*" multiple onChange={onPhotos} /></div></section>
    <section><h3>Places to visit <span className="cnt">{d.spots.filter((s) => s.done).length} of {d.spots.length}</span></h3>{d.spots.length ? <ul className="checks">{d.spots.map((spot, i) => <li key={`${spot.text}-${i}`}><label><input type="checkbox" checked={spot.done} onChange={(e) => onSpot({ spots: d.spots.map((s, index) => index === i ? { ...s, done: e.target.checked } : s) })} /><span>{spot.text}</span></label><button className="x" onClick={() => onSpot({ spots: d.spots.filter((_, index) => index !== i) })}>×</button></li>)}</ul> : <p className="empty-note">Nothing on the list yet.</p>}<form className="addrow" onSubmit={onAddSpot}><input name="spot" placeholder="Add a specific place" aria-label="Add a place to visit" /><button className="btn ghost sm">Add</button></form></section>
    {d.type === 'road' && <section><div className="route-section-heading"><h3>Route overview <span className="cnt">{d.route?.length || 0} stops</span></h3><button className="btn ghost sm" type="button" onClick={() => setEditingRoute((open) => !open)}>{editingRoute ? 'Close editor' : 'Edit route'}</button></div>{editingRoute && <RouteEditor d={d} onField={onField} onCancel={() => setEditingRoute(false)} onSaved={() => setEditingRoute(false)} />}<RoutePreview d={d} /></section>}
    <section><h3>Rough itinerary</h3>{d.days.length ? <ul className="days">{d.days.map((day, i) => <li key={i}><textarea rows="1" value={day} onChange={(e) => onField('days', d.days.map((line, index) => index === i ? e.target.value : line))} aria-label={`Itinerary line ${i + 1}`} /><button className="x" onClick={() => onField('days', d.days.filter((_, index) => index !== i))}>×</button></li>)}</ul> : <p className="empty-note">No itinerary yet. Sketch it one day at a time.</p>}<div className="addrow"><button className="btn ghost sm" onClick={onAddDay}>Add a day</button></div></section>
    <section><h3>When to go</h3>{d.sourceGuidance && <div className="source-guidance"><strong>Sourced climate guidance</strong><p>{d.sourceGuidance.summary}</p><small>{d.sourceGuidance.caveat}</small><div className="source-actions"><a href={d.sourceGuidance.url} target="_blank" rel="noreferrer">{d.sourceGuidance.sourceLabel || 'Open climate source'} ↗</a>{d.sourceGuidance.fallbackUrl && <a href={d.sourceGuidance.fallbackUrl} target="_blank" rel="noreferrer">Search alternate climate sources ↗</a>}</div>{d.sourceGuidance.sourceNote && <small>{d.sourceGuidance.sourceNote}</small>}</div>}<div className="strip" aria-label="Monthly seasonal planner">{MONTHS.map((month, i) => { const priceCode = d.seasonProfile?.pricePattern?.[i] || d.tiers[i] || '-'; const priceLabel = TIER_LABELS[priceCode] || 'not set'; const weatherCode = d.seasonProfile?.weatherPattern?.[i] || d.wx[i]; const monthNote = d.seasonProfile?.monthLevelSupported ? 'source-backed month detail' : 'editorial month estimate based on broad seasonal guidance'; return <div className="mo" key={month}><span className="month-name">{month}</span><span className="mt" data-v={priceCode} aria-label={`${month}: ${priceLabel}; ${monthNote}`} title={`${month}: ${priceLabel} · ${monthNote}`}>{MONTH_LETTERS[i]}</span><span className="mw" aria-label={`${month} weather: ${WEATHER_LABELS[weatherCode] || 'not set'}; ${monthNote}`} title={`${month} weather: ${WEATHER_LABELS[weatherCode] || 'not set'} · ${monthNote}`}>{WEATHER_GLYPHS[weatherCode] || '·'}</span></div>; })}</div><ul className="legend"><li><span className="sw" style={{ '--c': 'var(--tl)' }} />Shoulder Season</li><li><span className="sw" style={{ '--c': 'var(--tm)' }} />Mixed</li><li><span className="sw" style={{ '--c': 'var(--tp)' }} />Peak Season </li><li>☀ Sun / Drier</li><li>☔ Rain / Wetter</li><li>❄ Snow / Colder</li></ul><p className="budget-suggestion"><strong>Lower-cost planning:</strong> {budgetSummary(d)}</p><div className="when"><label>My seasonal planning note</label><textarea rows="2" value={d.when || ''} onChange={(e) => onField('when', e.target.value)} /></div></section>
    <section><h3>What pulls me</h3><div className="tags">{MOODS.map(([key,label]) => <button key={key} className="tg" aria-pressed={d.tags.includes(key)} onClick={() => toggleTag(key)}>{label}</button>)}</div></section>
    <section><h3>My note</h3><textarea className="hand" rows="2" value={d.note || ''} onChange={(e) => onField('note', e.target.value)} placeholder="Why this place? What do I hope to feel there?" />{d.sourceLinks?.length > 0 && <div className="sources"><span className="source-label">Planning starting points</span>{d.sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>}</section>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
