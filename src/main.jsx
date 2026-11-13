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
const CORE_STARTER = [
  {
    id: 'tci', name: 'Turks and Caicos', country: 'British Overseas Territory', type: 'place',
    lat: 21.8, lon: -71.9, status: 'dreaming', tags: ['sea', 'hike'],
    spots: ['Conch Bar Caves, Middle Caicos','Indian Cave and its sinkhole skylights','Mudjin Harbour cliffs and Dragon Cay','Crossing Place Trail to the Juniper Hole sea cave','Bambarra Beach','Flamingo Pond Overlook','Kayak Bottle Creek Lagoon in East Bay Islands National Park','Wade’s Green Plantation ruins, North Caicos','Grand Turk: Front and Duke Streets, National Museum, lighthouse'],
    days: ['Day 1 · Land in Providenciales, take the ferry to North Caicos (book ahead)','Day 2 · North Caicos: Wade’s Green ruins, Cottage Pond, Horsestable Beach','Day 3 · Kayak Bottle Creek, then Flamingo Pond','Day 4 · Middle Caicos: Conch Bar Caves, Indian Cave, Bambarra Beach','Day 5 · Mudjin Harbour and the Crossing Place Trail'],
    tiers: 'PPPPMLLLLLMP', wx: 'GGGGOORRRROG', when: 'November or May. Both are value months with decent weather.', note: '',
    route: [], photos: []
  },
  {
    id: 'moorea', name: 'Moorea', country: 'French Polynesia', type: 'place',
    lat: -17.53, lon: -149.83, status: 'dreaming', tags: ['sea','hike','food'],
    spots: ['Belvedere Lookout over Opunohu and Cook’s Bay','Te Fare Natura ecomuseum','Pineapple fields in Opunohu Valley','Kayak Cook’s Bay and picnic on a motu','Temae Beach: free public beach, snorkel the reef','Hike Magic Mountain','Afareaitu waterfalls hike','Poisson cru lunch in Ha’apiti'],
    days: ['Day 1 · Arrive from Tahiti, Cook’s Bay and the Rotui juice factory','Day 2 · Opunohu Valley: marae, ecomuseum, pineapple fields, Belvedere Lookout','Day 3 · Snorkel Temae Beach, then the Afareaitu waterfalls','Day 4 · Magic Mountain hike, then Tipaniers beach'],
    tiers: 'LLLLMMPPPMML', wx: 'RRROGGGGGGOR', when: 'May or June. Dry-season weather without July to September prices.', note: '', route: [], photos: []
  },
  {
    id: 'hawaii', name: 'Hawaiʻi (Big Island)', country: 'Hawaii, USA', type: 'place',
    lat: 19.6, lon: -155.5, status: 'dreaming', tags: ['sea','hike','food','culture'],
    spots: ['Hawaiʻi Volcanoes National Park','South Kona coffee farm tour','Snorkel Kealakekua Bay','Puʻuhonua o Hōnaunau National Historical Park','Punaluʻu Black Sand Beach','Hilo farmers market','Rainbow Falls, Hilo','Akaka Falls','Pololū Valley Lookout','Manta ray night snorkel'],
    days: ['Day 1 · Land in Kona, visit a South Kona coffee farm','Day 2 · Snorkel Kealakekua Bay, Puʻuhonua o Hōnaunau, then a manta ray night snorkel','Day 3 · Drive south past Punaluʻu Black Sand Beach to Volcano','Day 4 · Hawaiʻi Volcanoes National Park','Day 5 · Hilo: farmers market, Rainbow Falls, Akaka Falls'],
    tiers: 'MLPMLPPPLLLP', wx: 'OOOOGGGGGGOO', when: 'May, or September to early November. Avoid mid-December to early January.', note: '', route: [], photos: []
  },
  {
    id: 'channel', name: 'Channel Islands', country: 'California, USA', type: 'place',
    lat: 34, lon: -119.75, status: 'dreaming', tags: ['sea','hike'],
    spots: ['Island Packers ferry to Scorpion Anchorage, Santa Cruz Island','Cavern Point Loop','Scorpion Ranch historic site','Smuggler’s Cove hike','Potato Harbor Overlook at sunset','Kayak the sea caves to Painted Cave','Snorkel the kelp forest','Look for island foxes on a sunrise walk'],
    days: ['Day 1 · Ferry to Scorpion Anchorage, set up camp, Cavern Point Loop','Day 2 · Smuggler’s Cove hike or kayak to Painted Cave','Day 3 · Sunrise walk for island foxes, then ferry back'],
    tiers: 'LLMMMPPPLLLL', wx: 'RRGGGOOOGGOR', when: 'September or October. Fewer visitors and the clearest skies.', note: '', route: [], photos: []
  },
  {
    id: 'pch', name: 'Pacific Coast Highway', country: 'California, USA', type: 'road',
    lat: 36.37, lon: -121.9, status: 'dreaming', tags: ['road','hike','food'],
    route: [[37.77,-122.42],[37.46,-122.43],[36.97,-122.03],[36.6,-121.89],[36.37,-121.9],[36.16,-121.67],[35.67,-121.28],[35.14,-120.64],[34.42,-119.7],[34.05,-118.24]],
    routeNames: ['San Francisco','Half Moon Bay','Santa Cruz','Monterey','Big Sur','McWay Falls','Piedras Blancas','Morro Bay','Santa Barbara','Los Angeles'],
    spots: ['Half Moon Bay State Beach','Año Nuevo State Park elephant seals','Natural Bridges, Santa Cruz','Monterey Bay Aquarium','Point Lobos','Bixby Creek Bridge','Pfeiffer Beach','McWay Falls','Hearst Castle','Morro Bay','Santa Barbara Mission'],
    days: ['Day 1 · San Francisco to Santa Cruz via Half Moon Bay','Day 2 · Elkhorn Slough, Monterey Bay Aquarium, sleep in Carmel','Day 3 · Point Lobos, Bixby Bridge, Pfeiffer Beach and McWay Falls','Day 4 · Piedras Blancas seals, Hearst Castle, sleep in Cambria','Day 5 · Estero Bluffs and Morro Bay, finish in Los Angeles'],
    tiers: 'LLMMMPPPLLLL', wx: 'RRGGGOOOGGOR', when: 'September or October. Fewer tourists and the clearest skies.', note: '', routePhotos: [], photos: []
  }
];

const blankDestination = (id, name, country, lat, lon, tags = [], type = 'place') => ({
  id, name, country, type, lat, lon, status: 'dreaming', tags, spots: [], days: [],
  tiers: '', wx: '', when: '', note: '', sourceLinks: [], route: type === 'road' ? [[lat, lon]] : [], photos: []
});

const ADDITIONAL_STARTER = [
  blankDestination('bali', 'Bali', 'Indonesia', -8.34, 115.09, ['sea', 'culture', 'food', 'hike']),
  blankDestination('palau', 'Palau', 'Micronesia', 7.51, 134.58, ['sea', 'hike']),
  blankDestination('bora-bora', 'Bora Bora', 'French Polynesia', -16.5, -151.74, ['sea', 'food']),
  blankDestination('solomon-islands', 'Solomon Islands', 'Melanesia', -9.43, 159.96, ['sea', 'hike', 'culture']),
  blankDestination('italy', 'Italy', 'Europe', 41.87, 12.57, ['culture', 'food']),
  blankDestination('new-zealand', 'New Zealand', 'Oceania', -41.29, 174.78, ['hike', 'sea', 'food']),
  blankDestination('torres-del-paine', 'Torres del Paine', 'Patagonia, Chile', -50.94, -73.41, ['hike']),
  blankDestination('australia', 'Australia', 'Oceania', -25.27, 133.78, ['sea', 'hike', 'culture', 'food']),
  blankDestination('seychelles', 'Seychelles', 'Indian Ocean', -4.68, 55.49, ['sea', 'hike']),
  blankDestination('tanzania', 'Tanzania', 'East Africa', -6.37, 34.89, ['hike', 'culture']),
  blankDestination('spain', 'Spain', 'Europe', 40.46, -3.75, ['culture', 'food', 'sea']),
  blankDestination('portugal', 'Portugal', 'Europe', 39.4, -8.22, ['culture', 'food', 'sea']),
  blankDestination('iceland', 'Iceland', 'North Atlantic', 64.96, -19.02, ['hike', 'sea']),
  blankDestination('ireland', 'Ireland', 'Europe', 53.14, -7.69, ['culture', 'hike']),
  blankDestination('croatia', 'Croatia', 'Europe', 45.1, 15.2, ['sea', 'culture', 'food']),
  blankDestination('white-cliffs-dover', 'White Cliffs of Dover', 'England, UK', 51.13, 1.31, ['hike', 'culture']),
  blankDestination('greece', 'Greece', 'Europe', 39.07, 21.82, ['sea', 'culture', 'food']),
  blankDestination('switzerland', 'Switzerland', 'Europe', 46.82, 8.23, ['hike', 'culture']),
  blankDestination('norway', 'Norway', 'Europe', 60.47, 8.47, ['hike', 'sea', 'culture']),
  blankDestination('south-india', 'South India', 'India', 12.97, 77.59, ['culture', 'food', 'hike']),
  blankDestination('romania', 'Romania', 'Europe', 45.94, 24.97, ['culture', 'hike']),
  blankDestination('raja-ampat', 'Raja Ampat', 'Indonesia', -0.23, 130.52, ['sea', 'hike']),
  blankDestination('sulawesi', 'Sulawesi', 'Indonesia', -1.43, 121.45, ['sea', 'hike', 'culture']),
  blankDestination('zanzibar', 'Zanzibar', 'Tanzania', -6.16, 39.2, ['sea', 'culture', 'food']),
  blankDestination('belize', 'Belize', 'Central America', 17.19, -88.5, ['sea', 'hike', 'culture']),
  blankDestination('grenada', 'Grenada', 'Caribbean', 12.12, -61.68, ['sea', 'food', 'hike']),
  blankDestination('tahiti', 'Tahiti', 'French Polynesia', -17.65, -149.43, ['sea', 'hike', 'food'])
];

const STARTER = [...CORE_STARTER, ...ADDITIONAL_STARTER];

const SOURCE_GUIDANCE = {
  tci: ['Generally driest and most comfortable from roughly December–April; late summer–fall is hotter, wetter, and within Atlantic hurricane season.', 'https://www.visittci.com/about-turks-and-caicos/weather', 'Island conditions vary; check hurricane-season advisories.'],
  moorea: ['The drier, cooler season is generally May–October; November–April is warmer and wetter.', 'https://meteofrance.pf/climat', 'Regional French Polynesia guidance; Moorea conditions can vary locally.'],
  hawaii: ['Travel is possible year-round. Coastal weather is generally more reliable in summer, while winter brings greater rain and surf exposure on windward slopes.', 'https://www.weather.gov/hfo/climate', 'The Big Island has strong elevation and windward/leeward differences.'],
  channel: ['The park is open year-round; late summer through early fall often offers warmer weather and calmer seas, but fog, wind, and rough seas can occur any time.', 'https://www.nps.gov/chis/planyourvisit/weather.htm', 'Conditions vary day-to-day and island-to-island.'],
  pch: ['Late spring through early fall is usually the most dependable period for a coastal road trip; winter storms can affect roads and beaches.', 'https://www.visitcalifornia.com/road-trips/pacific-coast-highway/', 'The route crosses several microclimates; check Caltrans road conditions before departure.'],
  bali: ['The generally drier season is April–October; November–March is wetter, with heavier rain more likely.', 'https://www.bmkg.go.id/iklim/', 'Official Indonesian climate information is regional; rainfall varies across Bali.'],
  palau: ['Palau is warm and humid year-round; February–April is commonly described as relatively drier, but rain is possible every month.', 'https://pristineparadisepalau.com/plan-your-trip/', 'Marine visibility and sea state do not always match air-weather patterns.'],
  'bora-bora': ['May–October is generally drier and less humid; November–April is warmer and wetter.', 'https://meteofrance.pf/climat', 'Regional French Polynesia guidance; tropical showers can occur year-round.'],
  'solomon-islands': ['The drier months are generally more comfortable; eastern islands receive rain more consistently than Honiara.', 'https://www.visitsolomons.com.sb/about-the-solomon/weather/', 'Cyclones are uncommon but possible during the wetter period.'],
  italy: ['Spring and autumn are broadly favorable for sightseeing; summer is hottest and busiest.', 'https://www.italia.it/en/italy/when-to-go', 'Italy is climatically diverse, so interpret this by region.'],
  'new-zealand': ['December–February is warmest; March–May is a useful shoulder season; winter is colder and suited to snow sports.', 'https://www.newzealand.com/us/feature/new-zealand-weather-and-climate/', 'Weather changes quickly and differs between the North and South Islands.'],
  'torres-del-paine': ['For trekking, October–April is the main season; December–February has the longest, warmest days.', 'https://parquetorresdelpaine.cl/planifica-tu-visita/', 'Strong wind and rapidly changing weather remain possible throughout.'],
  australia: ['There is no single national best season: southern Australia is often most comfortable in spring–autumn, while tropical north is commonly favored May–October.', 'https://www.australia.com/en/facts-and-planning/when-to-go.html', 'Match timing to the specific state, coast, reef, or outback region.'],
  seychelles: ['The islands are warm year-round; April–October is influenced by southeast trade winds and is often drier.', 'https://www.seychelles.com/plan-your-visit/when-to-visit', 'Wind and sea conditions vary by island and month.'],
  tanzania: ['For safari, broadly drier periods are June–October and January–February; long rains commonly occur around March–May.', 'https://www.tanzaniaparks.go.tz/pages/best-time-to-visit', 'Safari, Kilimanjaro, and Zanzibar have different optimal periods.'],
  spain: ['Spring and autumn are generally the most moderate seasons; summer is hot, especially inland and in the south.', 'https://www.spain.info/en/discover-spain/weather/', 'Climate varies greatly among Atlantic, Mediterranean, plateau, and island regions.'],
  portugal: ['Spring and autumn generally provide moderate temperatures; summer is warm and dry, especially in the south.', 'https://www.visitportugal.com/en/content/weather-portugal', 'Madeira, the Azores, the Algarve, and northern Portugal differ.'],
  iceland: ['June–August offers the longest daylight and generally easiest road and hiking access; winter has shorter days and possible storms.', 'https://en.vedur.is/climatology/', 'Road and highland access can be restricted outside summer.'],
  ireland: ['May–September generally offers the mildest conditions and longest daylight, but rain is possible year-round.', 'https://www.met.ie/climate', 'Ireland has frequent local variation due to its maritime climate.'],
  croatia: ['May–June and September are generally favorable for the Adriatic coast; July–August are hottest and busiest.', 'https://croatia.hr/en-gb/travel-info/weather', 'The coast, islands, inland, and mountains differ considerably.'],
  'white-cliffs-dover': ['The cliffs can be visited year-round; late spring through early autumn usually provides longer daylight and milder walking conditions.', 'https://www.nationaltrust.org.uk/visit/kent/white-cliffs-of-dover', 'Wind, rain, fog, and slippery paths are possible in every season.'],
  greece: ['April–June and September–October are generally comfortable for sightseeing; July–August are hottest and peak season.', 'https://visitgreece.gr/before-you-travel/weather/', 'Mainland, islands, and mountains differ; check heat and wildfire conditions.'],
  switzerland: ['June–September is generally best for high-altitude hiking; December–March is the principal winter-sports season.', 'https://www.myswitzerland.com/en/planning/about-switzerland/climate/', 'Weather depends strongly on elevation and canton.'],
  norway: ['June–August generally offers the warmest conditions and best access for hiking; winter suits snow and aurora activities.', 'https://www.visitnorway.com/plan-your-trip/seasons-climate/', 'Western fjords, inland areas, and the north have different conditions.'],
  'south-india': ['Timing depends on the state; November–February is often the most broadly comfortable period, but monsoon patterns differ by coast.', 'https://www.keralatourism.org/faq/best-time-to-visit-kerala', 'There is no single South India season.'],
  romania: ['Late spring through early autumn is generally best for broad touring; winter is the principal season for snow activities.', 'https://www.meteoromania.ro/clima/', 'Romania has continental, Black Sea, and mountain climate zones.'],
  'raja-ampat': ['Raja Ampat is tropical year-round; October–April is commonly considered favorable for many marine activities.', 'https://www.indonesia.travel/gb/en/destinations/maluku-papua/west-papua/raja-ampat', 'Wind, rainfall, and visibility vary by island and season.'],
  sulawesi: ['There is no single island-wide best season; northern, central, and southern Sulawesi have different rainfall patterns.', 'https://www.bmkg.go.id/iklim/', 'Use regional and monthly climate information for the exact route.'],
  zanzibar: ['June–October is generally drier and cooler; January–February is another relatively dry interval.', 'https://www.zanzibartourism.go.tz/', 'Marine conditions and rainfall vary between Unguja and Pemba.'],
  belize: ['The generally drier season is roughly December–May; June–November is wetter and overlaps hurricane season.', 'https://www.travelbelize.org/plan-your-trip/when-to-go/', 'Rainfall varies between the coast, cayes, and inland mountains.'],
  grenada: ['January–May is generally the drier season; June–December is wetter and overlaps Atlantic hurricane season.', 'https://www.puregrenada.com/plan-your-trip/when-to-go/', 'Rainfall varies locally; check hurricane forecasts.'],
  tahiti: ['May–October is generally cooler and drier; November–April is warmer and wetter.', 'https://meteofrance.pf/climat', 'Tahiti’s west and east coasts can have different rainfall and wind.']
};

const SEASON_PROFILES = {
  tci: ['LLLLMMPPPPMM', 'GGGGOORRRROG', 'Drier', 'Shoulder', 'Wetter'],
  moorea: ['PPPPMMLLLLMM', 'RRROGGGGGGOR', 'Drier', 'Shoulder', 'Wetter'],
  hawaii: ['MMMLLPPPPMLL', 'OOOOGGGGGGOO', 'Drier/coastal', 'Shoulder', 'Wetter/windier'],
  channel: ['MMLLPPPPMMLL', 'RRGGGOOOGGOR', 'Calmer/drier', 'Shoulder', 'Cooler/wetter'],
  pch: ['MMLLPPPPMMLL', 'RRGGGOOOGGOR', 'More dependable', 'Shoulder', 'Stormier'],
  bali: ['PPMMLLLLMMMP', 'RRRROGGGGGOR', 'Drier', 'Shoulder', 'Wetter'],
  palau: ['MMLLLLMMMPPM', 'OOOGGGGGGOOO', 'Relatively drier', 'Shoulder', 'Wetter possible'],
  'bora-bora': ['PPMMLLLLMMMP', 'RRROGGGGGGOR', 'Drier', 'Shoulder', 'Wetter'],
  'solomon-islands': ['MMLLMMMPPPPMM', 'OOOORRRROOOO', 'Drier', 'Shoulder', 'Wetter'],
  italy: ['MMLLPPPPMMLL', 'GGGGOORRROGG', 'Milder', 'Shoulder', 'Hottest/busiest'],
  'new-zealand': ['LLMMPPPLLLMM', 'GGGGSSSSSSGG', 'Warmer', 'Shoulder', 'Colder/snow'],
  'torres-del-paine': ['MMLLPPPPMMLL', 'RRRRGGGGGGOR', 'Trekking season', 'Shoulder', 'Colder/less access'],
  australia: ['MMLLPPMMMLLM', 'OOOGGGROOOOGG', 'Region-dependent', 'Shoulder', 'Region-dependent'],
  seychelles: ['MMLLMMMPPPPMM', 'OOOOGGGGOORR', 'Trade-wind/drier', 'Transition', 'Wetter/humid'],
  tanzania: ['LLPPMMLLLLMM', 'GGGGOORRRRGG', 'Drier', 'Shoulder', 'Rainier'],
  spain: ['MMLLPPPPMMLL', 'GGGGOORRROGG', 'Milder', 'Shoulder', 'Hotter/busier'],
  portugal: ['MMLLPPPPMMLL', 'GGGGOORRROGG', 'Milder', 'Shoulder', 'Warmer/drier'],
  iceland: ['MMLLPPPPMMLL', 'RRRRSSSSSSRR', 'Winter', 'Shoulder', 'Easiest access'],
  ireland: ['MMLLPPPPMMLL', 'OOOGGGGOOOOGG', 'Milder/longer days', 'Shoulder', 'More unsettled'],
  croatia: ['MMLLPPPPMMLL', 'GGGGOORRROGG', 'Milder', 'Shoulder', 'Hotter/busier'],
  'white-cliffs-dover': ['MMLLPPPPMMLL', 'OOOGGGGOOOOGG', 'Milder/longer days', 'Shoulder', 'Cooler/wetter'],
  greece: ['MMLLPPPPMMLL', 'GGGGOORRROGG', 'Milder', 'Shoulder', 'Hottest/peak'],
  switzerland: ['PPMMLLLLMMMP', 'RRRRSSSSSSRR', 'Hiking', 'Shoulder', 'Winter sports'],
  norway: ['PPMMLLLLMMMP', 'RRRRSSSSSSRR', 'Winter', 'Shoulder', 'Hiking/long days'],
  'south-india': ['LLMMLLPPPPMM', 'GGGGOORRRROG', 'Drier/comfortable', 'Transition', 'Monsoon varies'],
  romania: ['MMLLPPPPMMLL', 'RRRRGGGGOORR', 'Touring', 'Shoulder', 'Winter/snow'],
  'raja-ampat': ['MMLLLLPPPPMM', 'OOOGGGGGGOOO', 'Marine window', 'Shoulder', 'Variable'],
  sulawesi: ['MMLLMMMPPPPMM', 'OOOGGGOORROO', 'Region-dependent', 'Variable', 'Region-dependent'],
  zanzibar: ['LLMMLLPPMMLL', 'GGGGOORRRRGG', 'Drier', 'Shoulder', 'Rainier'],
  belize: ['LLLMMMPPPPPM', 'GGGGOORRRROO', 'Drier', 'Shoulder', 'Wetter/storm risk'],
  grenada: ['LLLMMMPPPPPM', 'GGGGOORRRROO', 'Drier', 'Shoulder', 'Wetter/storm risk'],
  tahiti: ['PPMMLLLLMMMP', 'RRROGGGGGGOR', 'Drier/cooler', 'Shoulder', 'Wetter/warmer']
};

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

const CLIMATE_SOURCES = {
  tci: ['WeatherSpark climate search', 'https://weatherspark.com/search?q=Turks%20and%20Caicos'],
  moorea: ['Météo-France Polynesia climate', 'https://meteofrance.pf/climat'],
  hawaii: ['NOAA / National Weather Service Honolulu climate', 'https://www.weather.gov/hfo/climate'],
  channel: ['National Park Service weather guidance', 'https://www.nps.gov/chis/planyourvisit/weather.htm'],
  pch: ['WeatherSpark route climate search', 'https://weatherspark.com/search?q=Pacific%20Coast%20Highway'],
  bali: ['WeatherSpark Bali climate search', 'https://weatherspark.com/search?q=Bali%20Indonesia'],
  palau: ['WeatherSpark Palau climate search', 'https://weatherspark.com/search?q=Palau'],
  'bora-bora': ['WeatherSpark Bora Bora climate search', 'https://weatherspark.com/search?q=Bora%20Bora'],
  'solomon-islands': ['WeatherSpark Solomon Islands climate search', 'https://weatherspark.com/search?q=Solomon%20Islands'],
  italy: ['WeatherSpark Italy climate search', 'https://weatherspark.com/search?q=Italy'],
  'new-zealand': ['WeatherSpark New Zealand climate search', 'https://weatherspark.com/search?q=New%20Zealand'],
  'torres-del-paine': ['WeatherSpark Torres del Paine climate search', 'https://weatherspark.com/search?q=Torres%20del%20Paine'],
  australia: ['WeatherSpark Australia climate search', 'https://weatherspark.com/search?q=Australia'],
  seychelles: ['WeatherSpark Seychelles climate search', 'https://weatherspark.com/search?q=Seychelles'],
  tanzania: ['WeatherSpark Tanzania climate search', 'https://weatherspark.com/search?q=Tanzania'],
  spain: ['WeatherSpark Spain climate search', 'https://weatherspark.com/search?q=Spain'],
  portugal: ['Visit Portugal weather guidance', 'https://www.visitportugal.com/en/content/weather-portugal'],
  iceland: ['WeatherSpark Iceland climate search', 'https://weatherspark.com/search?q=Iceland'],
  ireland: ['Met Éireann climate', 'https://www.met.ie/climate'],
  croatia: ['WeatherSpark Croatia climate search', 'https://weatherspark.com/search?q=Croatia'],
  'white-cliffs-dover': ['WeatherSpark Dover climate search', 'https://weatherspark.com/search?q=Dover%20England'],
  greece: ['WeatherSpark Greece climate search', 'https://weatherspark.com/search?q=Greece'],
  switzerland: ['WeatherSpark Switzerland climate search', 'https://weatherspark.com/search?q=Switzerland'],
  norway: ['WeatherSpark Norway climate search', 'https://weatherspark.com/search?q=Norway'],
  'south-india': ['WeatherSpark South India climate search', 'https://weatherspark.com/search?q=South%20India'],
  romania: ['Meteoromania climate', 'https://www.meteoromania.ro/clima/'],
  'raja-ampat': ['WeatherSpark Raja Ampat climate search', 'https://weatherspark.com/search?q=Raja%20Ampat'],
  sulawesi: ['WeatherSpark Sulawesi climate search', 'https://weatherspark.com/search?q=Sulawesi'],
  zanzibar: ['WeatherSpark Zanzibar climate search', 'https://weatherspark.com/search?q=Zanzibar'],
  belize: ['WeatherSpark Belize climate search', 'https://weatherspark.com/search?q=Belize'],
  grenada: ['WeatherSpark Grenada climate search', 'https://weatherspark.com/search?q=Grenada'],
  tahiti: ['WeatherSpark Tahiti climate search', 'https://weatherspark.com/search?q=Tahiti']
};

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

const STARTER_CONTENT = {
  bali: {
    spots: ['Ubud rice terraces and village walks', 'East Bali water palaces and Sidemen valley', 'Mount Batur sunrise or a quieter volcano viewpoint', 'Snorkel or dive around Amed', 'South coast temple and sunset at Uluwatu'],
    days: ['Day 1 · Settle into Ubud and walk the rice terraces', 'Day 2 · Sidemen valley and East Bali water palaces', 'Day 3 · Amed coast: snorkeling, diving, or a slow beach day', 'Day 4 · Move south for Uluwatu and a sunset temple visit'],
    when: 'May to June or September. Wetter-season conditions vary by coast; check local forecasts before booking.',
    note: 'A mix of ceremonies, food, volcanic landscapes, and reef time. Keep the plan flexible around traffic and local holidays.',
    sourceLinks: [{ label: 'Indonesia Travel', url: 'https://www.indonesia.travel/' }]
  },
  palau: {
    spots: ['Rock Islands Southern Lagoon', 'Jellyfish Lake access and current conditions', 'Blue Corner or another guided dive site', 'Milky Way lagoon boat stop', 'Babeldaob coastal and cultural drive'],
    days: ['Day 1 · Arrive in Koror and orient around the lagoon', 'Day 2 · Boat through the Rock Islands with a swim or snorkel', 'Day 3 · Guided dive day, weather permitting', 'Day 4 · Babeldaob road trip and a quieter island afternoon'],
    when: 'December to April is often drier, but marine conditions and access rules change; confirm with local operators.',
    note: 'Best treated as a conservation-minded water trip: use licensed guides and check permits for sensitive sites.',
    sourceLinks: [{ label: 'Palau Visitors Authority', url: 'https://pristineparadisepalau.com/' }]
  },
  'bora-bora': {
    spots: ['Lagoon snorkeling or a guided reef excursion', 'Mount Otemanu viewpoint', 'Matira Beach', 'Vaitape market and village walk', 'Sunset from a lagoon-side picnic'],
    days: ['Day 1 · Arrive and settle into the lagoon rhythm', 'Day 2 · Guided lagoon and reef day', 'Day 3 · Matira Beach and a Mount Otemanu viewpoint', 'Day 4 · Slow morning, village walk, and sunset on the water'],
    when: 'May to October is generally drier; shoulder months can offer a quieter balance of weather and price.',
    note: 'A compact lagoon destination where the best days are usually built around water conditions rather than a packed checklist.',
    sourceLinks: [{ label: 'Tahiti Tourisme', url: 'https://www.tahititourisme.com/' }]
  },
  'solomon-islands': {
    spots: ['Honiara Central Market and WWII sites', 'Bonegi Beach and nearby wrecks', 'Mbonege or another guided village experience', 'Marovo Lagoon boat or dive excursion', 'Local forest, waterfall, or island walk'],
    days: ['Day 1 · Honiara market and orientation', 'Day 2 · WWII history and a coastal swim', 'Day 3 · Transfer or fly toward a lagoon base', 'Day 4 · Guided reef, village, or forest day'],
    when: 'April to October is commonly considered the drier travel window, but inter-island weather can change quickly.',
    note: 'Plan with local operators and generous transfer time; the appeal is depth and remoteness rather than speed.',
    sourceLinks: [{ label: 'Solomon Islands Visitors Bureau', url: 'https://www.visitsolomons.com.sb/' }]
  },
  italy: {
    spots: ['A historic neighborhood walk in Rome or another first base', 'A regional market and food-focused day', 'A smaller town or village outside the main cities', 'A museum, archaeological site, or church interior', 'A train journey between two distinct regions'],
    days: ['Day 1 · Arrive and take a neighborhood-scale walk', 'Day 2 · Major cultural site with an unstructured afternoon', 'Day 3 · Market, regional meal, and a smaller town', 'Day 4 · Travel day by train and a new local rhythm'],
    when: 'April to June or September to October usually offer a good balance; summer heat and crowds vary by region.',
    note: 'Italy is best planned as a region-by-region trip. Choose fewer bases and leave room for meals, trains, and wandering.',
    sourceLinks: [{ label: 'Italia.it', url: 'https://www.italia.it/en' }]
  },
  'new-zealand': {
    spots: ['A Great Walk or day hike suited to the season', 'Fiordland or a South Island lake viewpoint', 'A geothermal or cultural stop in the North Island', 'A local winery, farm, or food market', 'A stargazing or dark-sky experience'],
    days: ['Day 1 · Settle in and take a short local walk', 'Day 2 · Full-day landscape or hiking outing', 'Day 3 · Scenic drive with two intentional stops', 'Day 4 · Cultural, food, or geothermal day', 'Day 5 · Leave a weather buffer for the best outdoor plan'],
    when: 'December to March is the warmer hiking window; April to May and October to November can be quieter and changeable.',
    note: 'Build around weather and driving time. New Zealand rewards a slower itinerary with fewer long transfers.',
    sourceLinks: [{ label: '100% Pure New Zealand', url: 'https://www.newzealand.com/int/' }]
  },
  'torres-del-paine': {
    spots: ['A day on the W or O trekking route', 'Grey Glacier viewpoint or boat excursion', 'Los Cuernos and lake viewpoints', 'A weather-flexible valley walk', 'A quiet evening in Puerto Natales'],
    days: ['Day 1 · Puerto Natales preparation and weather check', 'Day 2 · Enter the park and hike the first trail section', 'Day 3 · Glacier or valley day, depending on conditions', 'Day 4 · Continue the route or use a shorter weather-safe walk', 'Day 5 · Return with a generous transfer buffer'],
    when: 'October to April is the main trekking season; wind, snow, and trail access can change quickly.',
    note: 'Treat this as a trekking destination rather than a conventional road trip. Reserve camps, transport, and park access early.',
    sourceLinks: [{ label: 'CONAF Torres del Paine', url: 'https://www.conaf.cl/parques/parque-nacional-torres-del-paine/' }]
  },
  australia: {
    spots: ['A coastal walk or reef day', 'An Aboriginal cultural experience with a local guide', 'A national park outside the main city', 'A regional food or wine stop', 'A long-distance landscape or outback viewpoint'],
    days: ['Day 1 · Choose a city or coast base and reset', 'Day 2 · Nature day with a guided or self-led walk', 'Day 3 · Cultural and food-focused day', 'Day 4 · Scenic transfer with one major landscape stop', 'Day 5 · Keep a weather and distance buffer'],
    when: 'Season depends heavily on region: southern Australia is often best in spring or autumn, while the tropical north has a different dry season.',
    note: 'Australia is a continent, not one compact itinerary. Pick a region first and keep internal travel realistic.',
    sourceLinks: [{ label: 'Australia.com', url: 'https://www.australia.com/en' }]
  },
  seychelles: {
    spots: ['Mahé coastal road and a Creole food stop', 'Praslin Vallée de Mai', 'La Digue cycle day and Anse Source d’Argent', 'A guided reef or snorkeling trip', 'A quieter beach or island viewpoint'],
    days: ['Day 1 · Mahé orientation and a coastal swim', 'Day 2 · Praslin forest and beach', 'Day 3 · La Digue by bicycle', 'Day 4 · Guided water day or a flexible island hop'],
    when: 'April to May and October to November are popular shoulder periods; wind and sea conditions shape ferry days.',
    note: 'Island-hopping works best with fewer transfers and a little slack for ferries and weather.',
    sourceLinks: [{ label: 'Seychelles Travel', url: 'https://www.seychelles.travel/en' }]
  },
  tanzania: {
    spots: ['A national park safari with a licensed guide', 'Ngorongoro Conservation Area', 'A local community or cultural visit', 'A highland or lake landscape', 'A rest day before or after a safari transfer'],
    days: ['Day 1 · Arrive and recover from the long transfer', 'Day 2 · Safari day with an experienced guide', 'Day 3 · Conservation or cultural day', 'Day 4 · Second wildlife area or highland landscape', 'Day 5 · Buffer day before onward travel'],
    when: 'June to October is a common safari window; rains and wildlife patterns vary by park and year.',
    note: 'Use licensed operators, respect wildlife distances, and plan rest around early starts and long transfers.',
    sourceLinks: [{ label: 'Tanzania Tourist Board', url: 'https://www.tanzaniatourism.go.tz/' }]
  },
  spain: {
    spots: ['A historic district walk', 'A regional market and tapas crawl', 'A landscape day outside the main city', 'A museum, palace, or architectural site', 'A beach or village day suited to the region'],
    days: ['Day 1 · Neighborhood walk and first local meal', 'Day 2 · Major cultural site and an unplanned afternoon', 'Day 3 · Regional market and a smaller town', 'Day 4 · Landscape, coast, or food-focused day'],
    when: 'April to June and September to October are often comfortable; summer heat differs significantly by region.',
    note: 'Choose one or two regions rather than trying to cross the country quickly.',
    sourceLinks: [{ label: 'Spain.info', url: 'https://www.spain.info/en/' }]
  },
  portugal: {
    spots: ['Lisbon neighborhood and miradouro walk', 'A Douro, Alentejo, or coastal food day', 'Sintra or another cultural day trip', 'A village or Atlantic coast walk', 'A local market and bakery stop'],
    days: ['Day 1 · Lisbon neighborhoods and viewpoints', 'Day 2 · Sintra or a slower cultural day', 'Day 3 · Market, bakery, and a regional meal', 'Day 4 · Coast or wine-country day'],
    when: 'April to June or September to October usually balance weather and crowds; the north and south differ.',
    note: 'Portugal works well with a few bases connected by train or short drives, not a rushed full-country loop.',
    sourceLinks: [{ label: 'Visit Portugal', url: 'https://www.visitportugal.com/en' }]
  },
  iceland: {
    spots: ['A geothermal pool or local bathing tradition', 'A waterfall and coastal landscape loop', 'A glacier, lava field, or guided outdoor day', 'A small-town bakery or harbor stop', 'A dark-sky or northern-lights opportunity in season'],
    days: ['Day 1 · Reykjavík and a local bathing experience', 'Day 2 · South coast waterfalls and black-sand landscape', 'Day 3 · Weather-flexible glacier or lava-field outing', 'Day 4 · Quiet town, harbor, and scenic return'],
    when: 'June to August offers long daylight; September to March offers winter atmosphere but shorter, more volatile days.',
    note: 'Never overpack the driving plan. Wind, road closures, and daylight should decide the route each day.',
    sourceLinks: [{ label: 'Inspired by Iceland', url: 'https://www.inspiredbyiceland.com/' }]
  },
  ireland: {
    spots: ['A coastal cliff walk', 'A traditional music session', 'A small-town market or pub lunch', 'A historic house, ruin, or abbey', 'A scenic drive with time for short walks'],
    days: ['Day 1 · Arrive and walk the nearest town', 'Day 2 · Coastal landscape and a local meal', 'Day 3 · History, music, and a flexible afternoon', 'Day 4 · Scenic drive with two short walks'],
    when: 'May to September has the longest days; shoulder months can be quieter but wetter and windier.',
    note: 'Leave extra time for narrow roads and weather. The best days often come from unplanned village stops.',
    sourceLinks: [{ label: 'Ireland.com', url: 'https://www.ireland.com/en-us/' }]
  },
  croatia: {
    spots: ['A historic coastal town walk', 'A national park waterfall or lake day', 'An island ferry day', 'A local seafood or market meal', 'A quieter inland village'],
    days: ['Day 1 · Coastal old town and harbor walk', 'Day 2 · National park or island day', 'Day 3 · Market, swim, and slower afternoon', 'Day 4 · Inland village or second island'],
    when: 'May, June, September, and early October are often easier than peak July and August.',
    note: 'Use fewer island transfers and let ferry schedules shape the itinerary.',
    sourceLinks: [{ label: 'Croatia.hr', url: 'https://croatia.hr/en-gb' }]
  },
  'white-cliffs-dover': {
    spots: ['White Cliffs of Dover coastal walk', 'Dover Castle', 'South Foreland Lighthouse area', 'A harbor and maritime history walk', 'A nearby village or garden'],
    days: ['Day 1 · Dover Castle and the harbor', 'Day 2 · Cliffs and South Foreland walk', 'Day 3 · Nearby coast or garden, weather permitting'],
    when: 'April to October offers longer walking days; cliff paths can be windy and muddy outside summer.',
    note: 'Stay on marked paths and keep well back from the cliff edge; conditions can change quickly.',
    sourceLinks: [{ label: 'National Trust', url: 'https://www.nationaltrust.org.uk/visit/kent/white-cliffs-of-dover' }]
  },
  greece: {
    spots: ['A historic site or archaeological museum', 'A village walk away from the busiest port', 'A swim or boat day', 'A local taverna and market meal', 'A mainland or island landscape hike'],
    days: ['Day 1 · Historic center and first taverna meal', 'Day 2 · Archaeology or museum morning', 'Day 3 · Swim, boat, or village day', 'Day 4 · Hike or slower inland route'],
    when: 'May to June and September to October are often more comfortable than peak summer; island weather varies.',
    note: 'Choose a small geographic cluster. Ferry schedules and heat make ambitious island-hopping tiring.',
    sourceLinks: [{ label: 'Visit Greece', url: 'https://visitgreece.gr/' }]
  },
  switzerland: {
    spots: ['A mountain train or cable-car viewpoint', 'A lakefront walk', 'A marked alpine hike suited to conditions', 'A village bakery or market', 'A museum or design-focused city day'],
    days: ['Day 1 · Lake or city orientation', 'Day 2 · Mountain viewpoint and short hike', 'Day 3 · Village, rail journey, and local meal', 'Day 4 · Weather-flexible alpine day'],
    when: 'June to September is the main high-alpine hiking season; lower valleys work well in spring and autumn.',
    note: 'Rail travel makes a multi-base trip practical, but mountain conditions still determine the day.',
    sourceLinks: [{ label: 'MySwitzerland', url: 'https://www.myswitzerland.com/en/' }]
  },
  norway: {
    spots: ['A fjord viewpoint or boat journey', 'A marked hike matched to conditions', 'A small harbor and local seafood stop', 'A scenic rail journey', 'A museum or cultural day in a city'],
    days: ['Day 1 · Harbor or city orientation', 'Day 2 · Fjord or coastal boat day', 'Day 3 · Hike with a weather-safe alternative', 'Day 4 · Scenic rail or road transfer'],
    when: 'June to August offers long daylight; May and September can be quieter with more variable conditions.',
    note: 'Distances look short on a map but travel slowly. Keep one flexible day for weather.',
    sourceLinks: [{ label: 'Visit Norway', url: 'https://www.visitnorway.com/' }]
  },
  'south-india': {
    spots: ['A South Indian market and breakfast walk', 'A temple or heritage site with local guidance', 'Backwater or coastal boat time', 'A hill-station or tea landscape', 'A regional cooking experience'],
    days: ['Day 1 · Market, breakfast, and neighborhood walk', 'Day 2 · Temple or heritage day', 'Day 3 · Coast or backwater transfer', 'Day 4 · Hills, tea, or food-focused day'],
    when: 'November to February is often more comfortable for broad regional travel; monsoon timing differs by coast.',
    note: 'South India is a large region. Pick a state or corridor first so the itinerary stays humane.',
    sourceLinks: [{ label: 'Incredible India', url: 'https://www.incredibleindia.gov.in/en' }]
  },
  romania: {
    spots: ['A historic Bucharest or regional city walk', 'A fortified church or medieval town', 'Carpathian foothill hike', 'A market and regional meal', 'A castle or folklore-focused day'],
    days: ['Day 1 · City neighborhood and market', 'Day 2 · Medieval town or fortified church', 'Day 3 · Carpathian landscape day', 'Day 4 · Castle, village, and a slower return'],
    when: 'May to October is generally easiest for hiking and road travel; winter conditions vary in the mountains.',
    note: 'A good fit for a mixed culture-and-landscape trip with a few bases rather than a fast loop.',
    sourceLinks: [{ label: 'Romania Travel', url: 'https://romania.travel/' }]
  },
  'raja-ampat': {
    spots: ['A guided lagoon and karst island boat day', 'A reef snorkeling or dive site', 'A hill viewpoint over the islands', 'A local village visit with permission', 'A quiet beach or mangrove paddle'],
    days: ['Day 1 · Arrive and settle into the island base', 'Day 2 · Guided reef and lagoon day', 'Day 3 · Viewpoint, village, or mangrove excursion', 'Day 4 · Weather-flexible water day'],
    when: 'October to April is a commonly used marine travel window, but sea conditions and local access vary.',
    note: 'Use local guides and conservation-minded operators. Transfers are part of the trip, not a footnote.',
    sourceLinks: [{ label: 'Indonesia Travel', url: 'https://www.indonesia.travel/' }]
  },
  sulawesi: {
    spots: ['A highland or volcanic landscape', 'A reef or island snorkeling day', 'A local market and regional meal', 'A cultural site with local guidance', 'A forest or waterfall walk'],
    days: ['Day 1 · Market and city orientation', 'Day 2 · Highland or volcanic landscape', 'Day 3 · Reef or island day', 'Day 4 · Cultural or forest excursion'],
    when: 'Dry-season timing differs by coast; May to October is a useful starting point for many routes, not a guarantee.',
    note: 'Choose one region of Sulawesi. Flights and road transfers can make a whole-island plan too ambitious.',
    sourceLinks: [{ label: 'Indonesia Travel', url: 'https://www.indonesia.travel/' }]
  },
  zanzibar: {
    spots: ['Stone Town heritage walk', 'A spice or food-focused local tour', 'A reef or dhow excursion', 'A quieter east-coast beach', 'A village or conservation visit'],
    days: ['Day 1 · Stone Town and harbor walk', 'Day 2 · Food, spice, and history', 'Day 3 · Transfer to the coast and a swim', 'Day 4 · Reef, dhow, or conservation day'],
    when: 'June to October is a common dry-season window; January to February can also be warm and relatively dry.',
    note: 'Pair historic Stone Town with unhurried coast time, and choose responsible marine operators.',
    sourceLinks: [{ label: 'Zanzibar Commission for Tourism', url: 'https://zanzibartourism.go.tz/' }]
  },
  belize: {
    spots: ['Barrier reef snorkeling or diving', 'A Maya archaeological site', 'A jungle or cave day with a licensed guide', 'A local food and market stop', 'A low-key island or coastal afternoon'],
    days: ['Day 1 · Belize City transfer and settle by the coast', 'Day 2 · Reef day with a licensed operator', 'Day 3 · Jungle, cave, or Maya site', 'Day 4 · Flexible island or food day'],
    when: 'December to April is the popular drier season; early summer can be quieter but wetter.',
    note: 'Belize combines reef and jungle well, but transfers deserve more time than the map suggests.',
    sourceLinks: [{ label: 'Travel Belize', url: 'https://www.travelbelize.org/' }]
  },
  grenada: {
    spots: ['Grand Anse and a quieter south-coast swim', 'St. George’s harbor and market', 'A spice or chocolate experience', 'A waterfall or rainforest walk', 'A guided reef or sailing day'],
    days: ['Day 1 · St. George’s and harbor orientation', 'Day 2 · Spice, chocolate, and inland landscape', 'Day 3 · Reef or sailing day', 'Day 4 · Waterfall and a slower beach afternoon'],
    when: 'December to April is generally the drier season; late summer and autumn can be wetter.',
    note: 'A compact island for combining food, rainforest, and water without rushing between bases.',
    sourceLinks: [{ label: 'Pure Grenada', url: 'https://www.puregrenada.com/' }]
  },
  tahiti: {
    spots: ['Papeete market and waterfront', 'A west-coast beach or lagoon day', 'A guided inland valley or waterfall excursion', 'A cultural or botanical stop', 'A ferry or flight connection to a neighboring island'],
    days: ['Day 1 · Papeete market and waterfront', 'Day 2 · West-coast lagoon and beach day', 'Day 3 · Guided inland landscape', 'Day 4 · Culture, food, or neighboring-island connection'],
    when: 'May to October is generally drier and cooler; shoulder months can be a good compromise.',
    note: 'Tahiti works as both a destination and a gateway. Keep transfers light and use local guides inland.',
    sourceLinks: [{ label: 'Tahiti Tourisme', url: 'https://www.tahititourisme.com/' }]
  }
};

Object.entries(STARTER_CONTENT).forEach(([id, content]) => {
  const destination = ADDITIONAL_STARTER.find((item) => item.id === id);
  if (destination) Object.assign(destination, content);
});

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
  const createDraft = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (!name) return;
    const type = form.get('type') === 'road' ? 'road' : 'place';
    const lat = Number(form.get('lat') || 0), lon = Number(form.get('lon') || 0);
    const next = normalized({ id: `p${Date.now().toString(36)}`, name, country: String(form.get('country') || '').trim(), type, lat, lon, status: 'dreaming', tags: type === 'road' ? ['road'] : [], spots: [], days: [], photos: [], route: type === 'road' ? [[lat, lon]] : [] });
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
    <section><h3>When to go</h3>{d.sourceGuidance && <div className="source-guidance"><strong>Sourced climate guidance</strong><p>{d.sourceGuidance.summary}</p><small>{d.sourceGuidance.caveat}</small><div className="source-actions"><a href={d.sourceGuidance.url} target="_blank" rel="noreferrer">{d.sourceGuidance.sourceLabel || 'Open climate source'} ↗</a>{d.sourceGuidance.fallbackUrl && <a href={d.sourceGuidance.fallbackUrl} target="_blank" rel="noreferrer">Search alternate climate sources ↗</a>}</div>{d.sourceGuidance.sourceNote && <small>{d.sourceGuidance.sourceNote}</small>}</div>}<p className="when-help">Green is a budget-planning estimate, yellow is middle, and red is commonly peak or less budget-friendly. These colors are not live fare data. Weather symbols show sun/drier, rain/wetter, or snow/colder conditions.</p><div className="strip" aria-label="Monthly seasonal planner">{MONTHS.map((month, i) => { const priceCode = d.seasonProfile?.pricePattern?.[i] || d.tiers[i] || '-'; const priceLabel = TIER_LABELS[priceCode] || 'not set'; const weatherCode = d.seasonProfile?.weatherPattern?.[i] || d.wx[i]; const monthNote = d.seasonProfile?.monthLevelSupported ? 'source-backed month detail' : 'editorial month estimate based on broad seasonal guidance'; return <div className="mo" key={month}><span className="month-name">{month}</span><span className="mt" data-v={priceCode} aria-label={`${month}: ${priceLabel}; ${monthNote}`} title={`${month}: ${priceLabel} · ${monthNote}`}>{MONTH_LETTERS[i]}</span><span className="mw" aria-label={`${month} weather: ${WEATHER_LABELS[weatherCode] || 'not set'}; ${monthNote}`} title={`${month} weather: ${WEATHER_LABELS[weatherCode] || 'not set'} · ${monthNote}`}>{WEATHER_GLYPHS[weatherCode] || '·'}</span></div>; })}</div><ul className="legend"><li><span className="sw" style={{ '--c': 'var(--tl)' }} />Budget-planning estimate</li><li><span className="sw" style={{ '--c': 'var(--tm)' }} />Middle / mixed</li><li><span className="sw" style={{ '--c': 'var(--tp)' }} />Commonly peak / less budget-friendly</li><li>☀ sun / drier</li><li>☔ rain / wetter</li><li>❄ snow / colder</li></ul><p className="budget-suggestion"><strong>Lower-cost planning:</strong> {budgetSummary(d)}</p><div className="when"><label>My seasonal planning note</label><textarea rows="2" value={d.when || ''} onChange={(e) => onField('when', e.target.value)} /></div></section>
    <section><h3>What pulls me</h3><div className="tags">{MOODS.map(([key,label]) => <button key={key} className="tg" aria-pressed={d.tags.includes(key)} onClick={() => toggleTag(key)}>{label}</button>)}</div></section>
    <section><h3>My note</h3><textarea className="hand" rows="2" value={d.note || ''} onChange={(e) => onField('note', e.target.value)} placeholder="Why this place? What do I hope to feel there?" />{d.sourceLinks?.length > 0 && <div className="sources"><span className="source-label">Planning starting points</span>{d.sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>}</section>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
