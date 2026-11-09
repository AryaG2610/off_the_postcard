import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
const xOf = (lon) => ((lon + 180) / 360) * 1000;
const yOf = (lat) => 250 - lat * (500 / 180);
const emptySpot = (text) => ({ text, done: false });
const normalized = (item) => ({ ...item, spots: (item.spots || []).map((s) => typeof s === 'string' ? emptySpot(s) : s), days: item.days || [], photos: item.photos || [], tiers: item.tiers || '', wx: item.wx || '' });

function App() {
  const [destinations, setDestinations] = useState(() => {
    try { return (JSON.parse(localStorage.getItem('off-the-postcard-v2'))?.dests || STARTER).map(normalized); } catch { return STARTER.map(normalized); }
  });
  const [selectedId, setSelectedId] = useState(() => destinations[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState('all');
  const [draft, setDraft] = useState(null);
  const [routeMode, setRouteMode] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('off-the-postcard-theme') || 'light');
  const fileInput = useRef(null);
  const selected = destinations.find((d) => d.id === selectedId);

  useEffect(() => { localStorage.setItem('off-the-postcard-v2', JSON.stringify({ dests: destinations })); }, [destinations]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('off-the-postcard-theme', theme); }, [theme]);

  const updateSelected = (patch) => setDestinations((items) => items.map((d) => d.id === selectedId ? { ...d, ...patch } : d));
  const filtered = useMemo(() => destinations.filter((d) => (statusFilter === 'all' || d.status === statusFilter) && (moodFilter === 'all' || d.tags.includes(moodFilter))), [destinations, statusFilter, moodFilter]);
  const taken = destinations.filter((d) => d.status === 'been').length;
  const addAt = (lat, lon) => {
    if (routeMode && selected?.type === 'road') { updateSelected({ route: [...(selected.route || []), [lat, lon]] }); return; }
    setDraft({ lat, lon, name: '', region: '', type: 'place' });
  };
  const mapClick = (event) => {
    const svg = event.currentTarget, rect = svg.getBoundingClientRect();
    const lon = ((event.clientX - rect.left) / rect.width) * 360 - 180;
    const lat = (250 - ((event.clientY - rect.top) / rect.height) * 396) / (500 / 180);
    addAt(Math.round(lat * 100) / 100, Math.round(lon * 100) / 100);
  };
  const createDraft = (event) => {
    event.preventDefault();
    if (!draft?.name.trim()) return;
    const next = normalized({ id: `p${Date.now().toString(36)}`, ...draft, status: 'dreaming', tags: draft.type === 'road' ? ['road'] : [], spots: [], days: [], photos: [], route: draft.type === 'road' ? [[draft.lat, draft.lon]] : [] });
    setDestinations((items) => [...items, next]); setSelectedId(next.id); setDraft(null); setRouteMode(next.type === 'road');
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
    <section aria-label="World map"><div className="plate"><svg className="map" viewBox="0 16 1000 396" onClick={mapClick} role="img" aria-label="World map with destination pins"><rect className="sea" x="0" y="16" width="1000" height="396" /><path className="land" d="M75 110l90-35 95 25 80-30 90 40 95-25 90 25 95-25 115 45 45 45-70 30-120-20-90 25-100-20-100 35-90-35-100 15-90-30zM245 235l75-10 45 60-30 95-70-20-45-80zM730 270l90-20 45 45-55 68-70-35z" /><g className="grid-lines">{[-150,-120,-90,-60,-30,0,30,60,90,120,150].map((lon) => <line key={`x${lon}`} x1={xOf(lon)} x2={xOf(lon)} y1="16" y2="412" />)}{[-30,0,30,60].map((lat) => <line key={`y${lat}`} x1="0" x2="1000" y1={yOf(lat)} y2={yOf(lat)} />)}</g><g>{destinations.filter((d) => d.type === 'road' && d.route?.length).map((d) => <polyline key={d.id} className="route" points={d.route.map(([lat, lon]) => `${xOf(lon)},${yOf(lat)}`).join(' ')} style={{ '--c': `var(--${d.status})` }} />)}{destinations.map((d) => <g key={d.id} className={`pin ${d.id === selectedId ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setSelectedId(d.id); setRouteMode(false); }} role="button" tabIndex="0" aria-label={d.name}><circle className="dot" cx={xOf(d.lon)} cy={yOf(d.lat)} r={d.id === selectedId ? 7 : 5} /><text x={xOf(d.lon) + (d.lon > 20 ? -10 : 10)} y={yOf(d.lat) + 5} textAnchor={d.lon > 20 ? 'end' : 'start'}>{d.name}</text></g>)}</g>{draft && <circle className="draftpin" cx={xOf(draft.lon)} cy={yOf(draft.lat)} r="8" />}</svg></div><p className="cap">{routeMode ? 'Adding route stops: click the map in order, then press Done.' : 'Click a pin to open its page. Click an empty spot to add a place or road trip.'}</p>{draft && <form className="draft" onSubmit={createDraft}><label>Name<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus /></label><label>Region<input value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} /></label><label>Type<select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="place">Place</option><option value="road">Road trip</option></select></label><span className="where">New pin at {coords(draft.lat, draft.lon)}</span><button className="btn sm" type="submit">Add</button><button type="button" className="btn ghost sm" onClick={() => setDraft(null)}>Cancel</button></form>}</section>
    <div className="grid"><nav className="index"><h2>Places index</h2><p className="flabel">Status</p><div className="chips">{[['all','All'],...STATUSES].map(([key,label]) => <button key={key} className="chip" aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>{key !== 'all' && <span className="dotc" style={{ '--c': `var(--${key})` }} />}{label} {key === 'all' ? destinations.length : destinations.filter((d) => d.status === key).length}</button>)}</div><p className="flabel">Type</p><div className="chips">{[['all','All types'],...MOODS].map(([key,label]) => <button key={key} className="chip" aria-pressed={moodFilter === key} onClick={() => setMoodFilter(key)}>{label} {key === 'all' ? destinations.length : destinations.filter((d) => d.tags.includes(key)).length}</button>)}</div><ul className="rows">{filtered.length ? filtered.map((d) => <li key={d.id}><button className="row" aria-current={d.id === selectedId} onClick={() => { setSelectedId(d.id); setRouteMode(false); }}><span className="dotc" style={{ '--c': `var(--${d.status})` }} /><span><span className="nm">{d.name}</span><span className="rg">{d.region}{d.type === 'road' ? ' · road trip' : ''}</span></span><span className="pr">{d.spots.filter((s) => s.done).length}/{d.spots.length}</span></button></li>) : <li className="none">Nothing matches these filters.</li>}</ul></nav>
      <main className="page">{selected ? <Destination d={selected} onField={changeField} onSpot={updateSelected} onAddSpot={addSpot} onAddDay={addDay} onCycle={cycleMonth} onPhotos={addPhotos} fileInput={fileInput} onRemove={removeSelected} routeMode={routeMode} setRouteMode={setRouteMode} /> : <p className="empty">No places yet. Click the map to add your first one.</p>}</main>
    </div>
  </div>;
}

function Destination({ d, onField, onSpot, onAddSpot, onAddDay, onCycle, onPhotos, fileInput, onRemove, routeMode, setRouteMode }) {
  const [confirm, setConfirm] = useState(false);
  const toggleTag = (tag) => onField('tags', d.tags.includes(tag) ? d.tags.filter((t) => t !== tag) : [...d.tags, tag]);
  return <><header><p className="eyebrow">{d.region} · {coords(d.lat, d.lon)}</p><h2><span className="hl">{d.name}</span></h2></header>
    <div className="seg">{STATUSES.map(([key,label]) => <button key={key} className="st" style={{ '--c': `var(--${key})` }} aria-pressed={d.status === key} onClick={() => onField('status', key)}>{label}</button>)}</div>
    <section><h3>Photos</h3><div className="photos">{(d.photos || []).map((photo) => <figure className="ph" key={photo.id}><img src={photo.url} alt={`Photo of ${d.name}`} /><button className="x" onClick={() => onField('photos', d.photos.filter((p) => p.id !== photo.id))}>Remove</button></figure>)}<label className="addph" htmlFor="photo-input"><b>Add photos</b><span>Trips you took, or places that inspire you</span></label><input ref={fileInput} id="photo-input" className="sr" type="file" accept="image/*" multiple onChange={onPhotos} /></div></section>
    <section><h3>Places to visit <span className="cnt">{d.spots.filter((s) => s.done).length} of {d.spots.length}</span></h3>{d.spots.length ? <ul className="checks">{d.spots.map((spot, i) => <li key={`${spot.text}-${i}`}><label><input type="checkbox" checked={spot.done} onChange={(e) => onSpot({ spots: d.spots.map((s, index) => index === i ? { ...s, done: e.target.checked } : s) })} /><span>{spot.text}</span></label><button className="x" onClick={() => onSpot({ spots: d.spots.filter((_, index) => index !== i) })}>×</button></li>)}</ul> : <p className="empty-note">Nothing on the list yet.</p>}<form className="addrow" onSubmit={onAddSpot}><input name="spot" placeholder="Add a specific place" aria-label="Add a place to visit" /><button className="btn ghost sm">Add</button></form></section>
    {d.type === 'road' && <section><h3>Route</h3><div className="routebar"><span className="n">{d.route?.length || 0} stops on the map</span>{d.route?.length > 1 && <a className="maps-link" href={`https://www.google.com/maps/dir/?api=1&origin=${d.route[0].join(',')}&destination=${d.route[d.route.length - 1].join(',')}`} target="_blank" rel="noreferrer">Open route in Google Maps ↗</a>}<button className="btn ghost sm" onClick={() => setRouteMode(!routeMode)}>{routeMode ? 'Done' : 'Add stops on the map'}</button><button className="btn ghost sm" disabled={!d.route?.length} onClick={() => onField('route', d.route.slice(0, -1))}>Undo last stop</button></div><p className="route-help">Add stops by clicking the map in order.</p>{d.route?.length ? <ol className="route-stops">{d.route.map((point, i) => <li key={`${point.join('-')}-${i}`}><div className="route-stop"><span className="num">{i + 1}.</span><span>{d.routeNames?.[i] || `Stop ${i + 1}`}<span className="coord">{coords(point[0], point[1])}</span></span></div></li>)}</ol> : <p className="empty-note">No stops yet.</p>}</section>}
    <section><h3>Rough itinerary</h3>{d.days.length ? <ul className="days">{d.days.map((day, i) => <li key={i}><textarea rows="1" value={day} onChange={(e) => onField('days', d.days.map((line, index) => index === i ? e.target.value : line))} aria-label={`Itinerary line ${i + 1}`} /><button className="x" onClick={() => onField('days', d.days.filter((_, index) => index !== i))}>×</button></li>)}</ul> : <p className="empty-note">No itinerary yet. Sketch it one day at a time.</p>}<div className="addrow"><button className="btn ghost sm" onClick={onAddDay}>Add a day</button></div></section>
    <section><h3>When to go</h3><div className="strip">{MONTHS.map((month, i) => <div className="mo" key={month}><button className="mt" data-v={d.tiers[i] || '-'} onClick={() => onCycle('tiers', i)} title={`${month}: ${TIER_LABELS[d.tiers[i]] || 'not set'}`}>{MONTH_LETTERS[i]}</button><button className="mw" onClick={() => onCycle('wx', i)} title={`${month}: ${WEATHER_LABELS[d.wx[i]] || 'not set'}`}>{WEATHER_GLYPHS[d.wx[i]] || '·'}</button></div>)}</div><ul className="legend"><li><span className="sw" style={{ '--c': 'var(--tl)' }} />Cheaper</li><li><span className="sw" style={{ '--c': 'var(--tm)' }} />Middle</li><li><span className="sw" style={{ '--c': 'var(--tp)' }} />Peak</li><li>● good weather</li><li>◐ mixed</li><li>○ rough</li></ul><div className="when"><label>Best cheaper window</label><textarea rows="2" value={d.when || ''} onChange={(e) => onField('when', e.target.value)} /></div></section>
    <section><h3>What pulls me</h3><div className="tags">{MOODS.map(([key,label]) => <button key={key} className="tg" aria-pressed={d.tags.includes(key)} onClick={() => toggleTag(key)}>{label}</button>)}</div></section>
    <section><h3>My note</h3><textarea className="hand" rows="2" value={d.note || ''} onChange={(e) => onField('note', e.target.value)} placeholder="Why this place? What do I hope to feel there?" /></section>
    <div className="foot"><button className="link" onClick={() => setConfirm(true)}>Remove this {d.type === 'road' ? 'road trip' : 'place'}</button>{confirm && <span>Remove it for good? <button className="link danger" onClick={onRemove}>Yes, remove</button> <button className="link" onClick={() => setConfirm(false)}>Keep it</button></span>}</div>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
