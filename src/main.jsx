import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from 'react-simple-maps';
import worldMap from 'world-atlas/land-110m.json';
import './styles.css';

const STATUSES = [['dreaming', 'Dreaming'], ['planning', 'Planning'], ['booked', 'Booked'], ['been', 'Been there']];
const MOODS = [['sea', 'Sea and beach'], ['hike', 'Hiking'], ['road', 'Road trip'], ['culture', 'Culture'], ['food', 'Food']];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_LETTERS = 'JFMAMJJASOND'.split('');
const TIER_LABELS = { L: 'Cheaper', M: 'Middle', P: 'Peak' };
const WEATHER_LABELS = { G: 'Good weather', O: 'Mixed weather', R: 'Rough weather' };
const WEATHER_GLYPHS = { G: '●', O: '◐', R: '○' };
const STARTER = [
  {
    id: 'tci', name: 'Turks and Caicos', region: 'British Overseas Territory', type: 'place',
    lat: 21.8, lon: -71.9, status: 'dreaming', tags: ['sea', 'hike'],
    spots: ['Conch Bar Caves, Middle Caicos','Indian Cave and its sinkhole skylights','Mudjin Harbour cliffs and Dragon Cay','Crossing Place Trail to the Juniper Hole sea cave','Bambarra Beach','Flamingo Pond Overlook','Kayak Bottle Creek Lagoon in East Bay Islands National Park','Wade’s Green Plantation ruins, North Caicos','Grand Turk: Front and Duke Streets, National Museum, lighthouse'],
    days: ['Day 1 · Land in Providenciales, take the ferry to North Caicos (book ahead)','Day 2 · North Caicos: Wade’s Green ruins, Cottage Pond, Horsestable Beach','Day 3 · Kayak Bottle Creek, then Flamingo Pond','Day 4 · Middle Caicos: Conch Bar Caves, Indian Cave, Bambarra Beach','Day 5 · Mudjin Harbour and the Crossing Place Trail'],
    tiers: 'PPPPMLLLLLMP', wx: 'GGGGOORRRROG', when: 'November or May. Both are value months with decent weather.', note: '',
    route: [], photos: []
  },
  {
    id: 'moorea', name: 'Moorea', region: 'French Polynesia', type: 'place',
    lat: -17.53, lon: -149.83, status: 'dreaming', tags: ['sea','hike','food'],
    spots: ['Belvedere Lookout over Opunohu and Cook’s Bay','Te Fare Natura ecomuseum','Pineapple fields in Opunohu Valley','Kayak Cook’s Bay and picnic on a motu','Temae Beach: free public beach, snorkel the reef','Hike Magic Mountain','Afareaitu waterfalls hike','Poisson cru lunch in Ha’apiti'],
    days: ['Day 1 · Arrive from Tahiti, Cook’s Bay and the Rotui juice factory','Day 2 · Opunohu Valley: marae, ecomuseum, pineapple fields, Belvedere Lookout','Day 3 · Snorkel Temae Beach, then the Afareaitu waterfalls','Day 4 · Magic Mountain hike, then Tipaniers beach'],
    tiers: 'LLLLMMPPPMML', wx: 'RRROGGGGGGOR', when: 'May or June. Dry-season weather without July to September prices.', note: '', route: [], photos: []
  },
  {
    id: 'hawaii', name: 'Hawaiʻi (Big Island)', region: 'Hawaii, USA', type: 'place',
    lat: 19.6, lon: -155.5, status: 'dreaming', tags: ['sea','hike','food','culture'],
    spots: ['Hawaiʻi Volcanoes National Park','South Kona coffee farm tour','Snorkel Kealakekua Bay','Puʻuhonua o Hōnaunau National Historical Park','Punaluʻu Black Sand Beach','Hilo farmers market','Rainbow Falls, Hilo','Akaka Falls','Pololū Valley Lookout','Manta ray night snorkel'],
    days: ['Day 1 · Land in Kona, visit a South Kona coffee farm','Day 2 · Snorkel Kealakekua Bay, Puʻuhonua o Hōnaunau, then a manta ray night snorkel','Day 3 · Drive south past Punaluʻu Black Sand Beach to Volcano','Day 4 · Hawaiʻi Volcanoes National Park','Day 5 · Hilo: farmers market, Rainbow Falls, Akaka Falls'],
    tiers: 'MLPMLPPPLLLP', wx: 'OOOOGGGGGGOO', when: 'May, or September to early November. Avoid mid-December to early January.', note: '', route: [], photos: []
  },
  {
    id: 'channel', name: 'Channel Islands', region: 'California, USA', type: 'place',
    lat: 34, lon: -119.75, status: 'dreaming', tags: ['sea','hike'],
    spots: ['Island Packers ferry to Scorpion Anchorage, Santa Cruz Island','Cavern Point Loop','Scorpion Ranch historic site','Smuggler’s Cove hike','Potato Harbor Overlook at sunset','Kayak the sea caves to Painted Cave','Snorkel the kelp forest','Look for island foxes on a sunrise walk'],
    days: ['Day 1 · Ferry to Scorpion Anchorage, set up camp, Cavern Point Loop','Day 2 · Smuggler’s Cove hike or kayak to Painted Cave','Day 3 · Sunrise walk for island foxes, then ferry back'],
    tiers: 'LLMMMPPPLLLL', wx: 'RRGGGOOOGGOR', when: 'September or October. Fewer visitors and the clearest skies.', note: '', route: [], photos: []
  },
  {
    id: 'pch', name: 'Pacific Coast Highway', region: 'California, USA', type: 'road',
    lat: 36.37, lon: -121.9, status: 'dreaming', tags: ['road','hike','food'],
    route: [[37.77,-122.42],[37.46,-122.43],[36.97,-122.03],[36.6,-121.89],[36.37,-121.9],[36.16,-121.67],[35.67,-121.28],[35.14,-120.64],[34.42,-119.7],[34.05,-118.24]],
    routeNames: ['San Francisco','Half Moon Bay','Santa Cruz','Monterey','Big Sur','McWay Falls','Piedras Blancas','Morro Bay','Santa Barbara','Los Angeles'],
    spots: ['Half Moon Bay State Beach','Año Nuevo State Park elephant seals','Natural Bridges, Santa Cruz','Monterey Bay Aquarium','Point Lobos','Bixby Creek Bridge','Pfeiffer Beach','McWay Falls','Hearst Castle','Morro Bay','Santa Barbara Mission'],
    days: ['Day 1 · San Francisco to Santa Cruz via Half Moon Bay','Day 2 · Elkhorn Slough, Monterey Bay Aquarium, sleep in Carmel','Day 3 · Point Lobos, Bixby Bridge, Pfeiffer Beach and McWay Falls','Day 4 · Piedras Blancas seals, Hearst Castle, sleep in Cambria','Day 5 · Estero Bluffs and Morro Bay, finish in Los Angeles'],
    tiers: 'LLMMMPPPLLLL', wx: 'RRGGGOOOGGOR', when: 'September or October. Fewer tourists and the clearest skies.', note: '', routePhotos: [], photos: []
  }
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const coords = (lat, lon) => `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`;
const emptySpot = (text) => ({ text, done: false });
const normalized = (item) => ({ ...item, spots: (item.spots || []).map((s) => typeof s === 'string' ? emptySpot(s) : s), days: item.days || [], photos: item.photos || [], tiers: item.tiers || '', wx: item.wx || '' });
const haversine = (a, b) => {
  const radius = 3958.8, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
const routeDistance = (route = []) => route.slice(1).reduce((total, point, index) => total + haversine(route[index], point), 0);
const routeTime = (route = []) => Math.max(0, routeDistance(route) / 48);
const formatDuration = (hours) => `${Math.floor(hours)} hr ${Math.round((hours % 1) * 60)} min`;

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
      {!routePoints.length && destinations.map((d) => <Marker key={d.id} coordinates={[d.lon, d.lat]} onClick={() => onSelect(d.id)}><circle className={`destination-marker ${d.id === selectedId ? 'selected' : ''}`} r={d.id === selectedId ? 7 : 5} /><text className="destination-label" x={d.lon > 20 ? -10 : 10} y="5" textAnchor={d.lon > 20 ? 'end' : 'start'}>{d.name}</text></Marker>)}</>;
  return <div className={`map-shell ${addMode ? 'map-add-mode' : ''} ${routePoints.length ? 'route-map-static' : ''}`} style={routePoints.length ? { '--route-height': `${routeHeight}px` } : undefined}><ComposableMap projection="geoMercator" projectionConfig={routePoints.length ? { scale: routeScale, center: focus } : { scale: 145 }} width={1000} height={routePoints.length ? routeHeight : 440}>
    {routePoints.length ? mapContent : <ZoomableGroup center={position.coordinates} zoom={position.zoom} onMoveEnd={setPosition} minZoom={1} maxZoom={8}>
      {mapContent}
    </ZoomableGroup>}
  </ComposableMap>{!routePoints.length && <p className="map-help">Drag to pan. Scroll or pinch to zoom. Select a destination from the index below.</p>}</div>;
}

function App() {
  const [destinations, setDestinations] = useState(() => {
    try { return (JSON.parse(localStorage.getItem('off-the-postcard-v2'))?.dests || STARTER).map(normalized); } catch { return STARTER.map(normalized); }
  });
  const [selectedId, setSelectedId] = useState(() => destinations[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('off-the-postcard-theme') || 'light');
  const fileInput = useRef(null);
  const selected = destinations.find((d) => d.id === selectedId);

  useEffect(() => { localStorage.setItem('off-the-postcard-v2', JSON.stringify({ dests: destinations })); }, [destinations]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('off-the-postcard-theme', theme); }, [theme]);

  const updateSelected = (patch) => setDestinations((items) => items.map((d) => d.id === selectedId ? { ...d, ...patch } : d));
  const filtered = useMemo(() => destinations.filter((d) => (statusFilter === 'all' || d.status === statusFilter) && (moodFilter === 'all' || d.tags.includes(moodFilter))), [destinations, statusFilter, moodFilter]);
  const taken = destinations.filter((d) => d.status === 'been').length;
  const createDraft = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (!name) return;
    const type = form.get('type') === 'road' ? 'road' : 'place';
    const lat = Number(form.get('lat') || 0), lon = Number(form.get('lon') || 0);
    const next = normalized({ id: `p${Date.now().toString(36)}`, name, region: String(form.get('region') || '').trim(), type, lat, lon, status: 'dreaming', tags: type === 'road' ? ['road'] : [], spots: [], days: [], photos: [], route: type === 'road' ? [[lat, lon]] : [] });
    setDestinations((items) => [...items, next]); setSelectedId(next.id); setAddOpen(false);
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
    <section aria-label="World map"><div className="plate"><MapView destinations={destinations} selectedId={selectedId} onSelect={setSelectedId} /></div><div className="map-actions"><button className="btn sm" onClick={() => setAddOpen(true)}>＋ Add destination or trip</button></div>{addOpen && <form className="draft" onSubmit={createDraft}><label>Name<input name="name" required autoFocus /></label><label>Region<input name="region" /></label><label>Type<select name="type" defaultValue="place"><option value="place">Place</option><option value="road">Road trip</option></select></label><label>Latitude<input name="lat" type="number" step="0.01" min="-90" max="90" defaultValue="0" /></label><label>Longitude<input name="lon" type="number" step="0.01" min="-180" max="180" defaultValue="0" /></label><button className="btn sm" type="submit">Add to notebook</button><button type="button" className="btn ghost sm" onClick={() => setAddOpen(false)}>Cancel</button></form>}</section>
    <div className="grid"><nav className="index"><h2>Places index</h2><p className="flabel">Status</p><div className="chips">{[['all','All'],...STATUSES].map(([key,label]) => <button key={key} className="chip" aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>{key !== 'all' && <span className="dotc" style={{ '--c': `var(--${key})` }} />}{label} {key === 'all' ? destinations.length : destinations.filter((d) => d.status === key).length}</button>)}</div><p className="flabel">Type</p><div className="chips">{[['all','All types'],...MOODS].map(([key,label]) => <button key={key} className="chip" aria-pressed={moodFilter === key} onClick={() => setMoodFilter(key)}>{label} {key === 'all' ? destinations.length : destinations.filter((d) => d.tags.includes(key)).length}</button>)}</div><ul className="rows">{filtered.length ? filtered.map((d) => <li key={d.id}><button className="row" aria-current={d.id === selectedId} onClick={() => setSelectedId(d.id)}><span className="dotc" style={{ '--c': `var(--${d.status})` }} /><span><span className="nm">{d.name}</span><span className="rg">{d.region}{d.type === 'road' ? ' · road trip' : ''}</span></span><span className="pr">{d.spots.filter((s) => s.done).length}/{d.spots.length}</span></button></li>) : <li className="none">Nothing matches these filters.</li>}</ul></nav>
      <main className="page">{selected ? <Destination d={selected} onField={changeField} onSpot={updateSelected} onAddSpot={addSpot} onAddDay={addDay} onCycle={cycleMonth} onPhotos={addPhotos} fileInput={fileInput} onRemove={removeSelected} /> : <p className="empty">No places yet. Use Add destination or trip to create your first one.</p>}</main>
    </div>
  </div>;
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
  const toggleTag = (tag) => onField('tags', d.tags.includes(tag) ? d.tags.filter((t) => t !== tag) : [...d.tags, tag]);
  return <><header><p className="eyebrow">{d.region} · {coords(d.lat, d.lon)}</p><h2><span className="hl">{d.name}</span></h2></header>
    <div className="seg">{STATUSES.map(([key,label]) => <button key={key} className="st" style={{ '--c': `var(--${key})` }} aria-pressed={d.status === key} onClick={() => onField('status', key)}>{label}</button>)}</div>
    <section><h3>Photos</h3><div className="photos">{(d.photos || []).map((photo) => <figure className="ph" key={photo.id}><img src={photo.url} alt={`Photo of ${d.name}`} /><button className="x" onClick={() => onField('photos', d.photos.filter((p) => p.id !== photo.id))}>Remove</button></figure>)}<label className="addph" htmlFor="photo-input"><b>Add photos</b><span>Trips you took, or places that inspire you</span></label><input ref={fileInput} id="photo-input" className="sr" type="file" accept="image/*" multiple onChange={onPhotos} /></div></section>
    <section><h3>Places to visit <span className="cnt">{d.spots.filter((s) => s.done).length} of {d.spots.length}</span></h3>{d.spots.length ? <ul className="checks">{d.spots.map((spot, i) => <li key={`${spot.text}-${i}`}><label><input type="checkbox" checked={spot.done} onChange={(e) => onSpot({ spots: d.spots.map((s, index) => index === i ? { ...s, done: e.target.checked } : s) })} /><span>{spot.text}</span></label><button className="x" onClick={() => onSpot({ spots: d.spots.filter((_, index) => index !== i) })}>×</button></li>)}</ul> : <p className="empty-note">Nothing on the list yet.</p>}<form className="addrow" onSubmit={onAddSpot}><input name="spot" placeholder="Add a specific place" aria-label="Add a place to visit" /><button className="btn ghost sm">Add</button></form></section>
    {d.type === 'road' && <section><h3>Route overview <span className="cnt">{d.route?.length || 0} stops</span></h3><RoutePreview d={d} /></section>}
    <section><h3>Rough itinerary</h3>{d.days.length ? <ul className="days">{d.days.map((day, i) => <li key={i}><textarea rows="1" value={day} onChange={(e) => onField('days', d.days.map((line, index) => index === i ? e.target.value : line))} aria-label={`Itinerary line ${i + 1}`} /><button className="x" onClick={() => onField('days', d.days.filter((_, index) => index !== i))}>×</button></li>)}</ul> : <p className="empty-note">No itinerary yet. Sketch it one day at a time.</p>}<div className="addrow"><button className="btn ghost sm" onClick={onAddDay}>Add a day</button></div></section>
    <section><h3>When to go</h3><p className="when-help">A quick planning reference for typical price levels and weather by month. These are notes, not live forecasts or fares.</p><div className="strip" aria-label="Monthly price and weather planner">{MONTHS.map((month, i) => <div className="mo" key={month}><span className="month-name">{month}</span><span className="mt" data-v={d.tiers[i] || '-'} aria-label={`${month} price level: ${TIER_LABELS[d.tiers[i]] || 'not set'}`} title={`${month}: ${TIER_LABELS[d.tiers[i]] || 'not set'}`}>{MONTH_LETTERS[i]}</span><span className="mw" aria-label={`${month} weather: ${WEATHER_LABELS[d.wx[i]] || 'not set'}`} title={`${month}: ${WEATHER_LABELS[d.wx[i]] || 'not set'}`}>{WEATHER_GLYPHS[d.wx[i]] || '·'}</span></div>)}</div><ul className="legend"><li><span className="sw" style={{ '--c': 'var(--tl)' }} />Cheaper</li><li><span className="sw" style={{ '--c': 'var(--tm)' }} />Middle</li><li><span className="sw" style={{ '--c': 'var(--tp)' }} />Peak</li><li>● good weather</li><li>◐ mixed</li><li>○ rough</li></ul><div className="when"><label>Best cheaper window</label><textarea rows="2" value={d.when || ''} onChange={(e) => onField('when', e.target.value)} /></div></section>
    <section><h3>What pulls me</h3><div className="tags">{MOODS.map(([key,label]) => <button key={key} className="tg" aria-pressed={d.tags.includes(key)} onClick={() => toggleTag(key)}>{label}</button>)}</div></section>
    <section><h3>My note</h3><textarea className="hand" rows="2" value={d.note || ''} onChange={(e) => onField('note', e.target.value)} placeholder="Why this place? What do I hope to feel there?" /></section>
    <div className="foot"><button className="link" onClick={() => setConfirm(true)}>Remove this {d.type === 'road' ? 'road trip' : 'place'}</button>{confirm && <span>Remove it for good? <button className="link danger" onClick={onRemove}>Yes, remove</button> <button className="link" onClick={() => setConfirm(false)}>Keep it</button></span>}</div>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
