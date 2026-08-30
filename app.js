const UKRAINE = [31.1656, 48.3794];
const DEFAULT_ZOOM = 5.15;
const RETURN_DELAY = 12000;
const REGION_FILES = [
  'UA_05_Vinnytska.geojson',
  'UA_07_Volynska.geojson',
  'UA_09_Luhanska.geojson',
  'UA_12_Dnipropetrovska.geojson',
  'UA_14_Donetska.geojson',
  'UA_18_Zhytomyrska.geojson',
  'UA_21_Zakarpatska.geojson',
  'UA_23_Zaporizka.geojson',
  'UA_26_Ivano_Frankivska.geojson',
  'UA_32_Kyivska.geojson',
  'UA_35_Kirovohradska.geojson',
  'UA_43_Avtonomna_Respublika_Krym.geojson',
  'UA_46_Lvivska.geojson',
  'UA_48_Mykolaivska.geojson',
  'UA_51_Odeska.geojson',
  'UA_53_Poltavska.geojson',
  'UA_56_Rivnenska.geojson',
  'UA_59_Sumska.geojson',
  'UA_61_Ternopilska.geojson',
  'UA_63_Kharkivska.geojson',
  'UA_65_Khersonska.geojson',
  'UA_68_Khmelnytska.geojson',
  'UA_71_Cherkaska.geojson',
  'UA_74_Chernihivska.geojson',
  'UA_77_Chernivetska.geojson'
];



const REGION_NEPTUN_KEYS = [
  'vinnytska',
  'volynska',
  'luhanska',
  'dnipropetrovska',
  'donetska',
  'zhytomyrska',
  'zakarpatska',
  'zaporizka',
  'ivano-frankivska',
  'kyivska',
  'kirovohradska',
  'krymska',
  'lvivska',
  'mykolaivska',
  'odeska',
  'poltavska',
  'rivnenska',
  'sumska',
  'ternopilska',
  'kharkivska',
  'khersonska',
  'khmelnytska',
  'cherkaska',
  'chernihivska',
  'chernivetska'
];

const OBLAST_NAME_TO_KEY = {
  'вінницька': 'vinnytska',
  'волинська': 'volynska',
  'луганська': 'luhanska',
  'дніпропетровська': 'dnipropetrovska',
  'донецька': 'donetska',
  'житомирська': 'zhytomyrska',
  'закарпатська': 'zakarpatska',
  'запорізька': 'zaporizka',
  'івано-франківська': 'ivano-frankivska',
  'київська': 'kyivska',
  'м. київ': 'kyivska',
  'київ': 'kyivska',
  'кіровоградська': 'kirovohradska',
  'автономна республіка крим': 'krymska',
  'ар крим': 'krymska',
  'крим': 'krymska',
  'львівська': 'lvivska',
  'миколаївська': 'mykolaivska',
  'одеська': 'odeska',
  'полтавська': 'poltavska',
  'рівненська': 'rivnenska',
  'сумська': 'sumska',
  'тернопільська': 'ternopilska',
  'харківська': 'kharkivska',
  'херсонська': 'khersonska',
  'хмельницька': 'khmelnytska',
  'черкаська': 'cherkaska',
  'чернігівська': 'chernihivska',
  'чернівецька': 'chernivetska'
};

let regionsGeoJSON = null;
let neptunOblastsGeoJSON = null;
let neptunRaionsGeoJSON = null;
let neptunRestTimer = null;

let neptunThreatsTimer = null;
let neptunRealtimeClient = null;
let neptunRealtimeUnsubscribe = null;
let currentThreats = [];
let threatAnimationFrame = null;
const threatMarkers = new Map();

const THREAT_META = {
  uav:       { label: 'ШАХЕД / БПЛА', short: 'БПЛА', color: '#ff4d4d', iconKey: 'uav' },
  recon:     { label: 'РОЗВІД-БПЛА', short: 'РОЗВІД', color: '#f7d154', iconKey: 'recon' },
  fpv:       { label: 'FPV-ДРОН', short: 'FPV', color: '#ff884d', iconKey: 'fpv' },
  missile:   { label: 'РАКЕТА', short: 'РАКЕТА', color: '#ff1f1f', iconKey: 'missile' },
  ballistic: { label: 'БАЛІСТИКА', short: 'БАЛІСТ.', color: '#ff00d4', iconKey: 'ballistic' },
  kab:       { label: 'КАБ', short: 'КАБ', color: '#ff9f1a', iconKey: 'kab' },
  mig31k:    { label: 'МІГ-31К', short: 'МІГ-31К', color: '#b794ff', iconKey: 'mig31k' },
  unknown:   { label: 'НЕВІДОМА ЦІЛЬ', short: 'ЦІЛЬ', color: '#ffffff', iconKey: 'unknown' }
};

const THREAT_ICON_SVG = {
  // Мінімалістичні силуети зверху. Ніс кожної цілі спрямований вгору (0°).
  uav:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 3 L36 16 L58 35 L45 38 L37 35 L35 39 L38 42 L32 43 L26 42 L29 39 L27 35 L19 38 L6 35 L28 16 Z"/></svg>`,
  recon:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 4 L36 18 L56 34 L43 37 L36 34 L35 51 L40 57 L34 56 L32 61 L30 56 L24 57 L29 51 L28 34 L21 37 L8 34 L28 18 Z"/><circle cx="32" cy="28" r="2.2" class="target-cutout"/></svg>`,
  fpv:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-stroke" d="M23 23 41 41M41 23 23 41M32 24V40M24 32H40"/><circle cx="18" cy="18" r="7" class="target-ring"/><circle cx="46" cy="18" r="7" class="target-ring"/><circle cx="18" cy="46" r="7" class="target-ring"/><circle cx="46" cy="46" r="7" class="target-ring"/><rect x="27" y="27" width="10" height="10" rx="2" class="target-silhouette"/></svg>`,
  missile:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 3 C27 9 26 16 26 25 L26 40 L17 51 L26 48 L28 61 L32 55 L36 61 L38 48 L47 51 L38 40 L38 25 C38 16 37 9 32 3 Z"/><path class="target-cutout" d="M30 17h4v22h-4z"/></svg>`,
  ballistic:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 2 C26 10 25 17 25 27 L25 43 L15 55 L26 51 L29 62 L32 56 L35 62 L38 51 L49 55 L39 43 L39 27 C39 17 38 10 32 2 Z"/></svg>`,
  kab:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 5 C26 11 25 19 26 29 L12 36 L26 39 L28 52 L22 59 L32 56 L42 59 L36 52 L38 39 L52 36 L38 29 C39 19 38 11 32 5 Z"/></svg>`,
  mig31k:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 2 L37 19 L58 34 L43 37 L37 34 L36 49 L43 57 L35 55 L32 62 L29 55 L21 57 L28 49 L27 34 L21 37 L6 34 L27 19 Z"/></svg>`,
  unknown:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="10" class="target-silhouette"/></svg>`
};

function threatIconSvg(iconKey) {
  return THREAT_ICON_SVG[iconKey] || THREAT_ICON_SVG.unknown;
}

function threatMeta(type) {
  return THREAT_META[type] || THREAT_META.unknown;
}

function destinationPoint(lat, lon, bearingDeg, distanceKm) {
  const R = 6371;
  const d = distanceKm / R;
  const brng = bearingDeg * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lon1 = lon * Math.PI / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: lat2 * 180 / Math.PI, lon: ((lon2 * 180 / Math.PI + 540) % 360) - 180 };
}

function fallbackMotionForThreat(threat) {
  const type = String(threat?.type || 'unknown').toLowerCase();
  const explicitSpeed = Number(threat?.velocity?.speedKmh ?? threat?.speedKmh ?? threat?.speed_kmh);
  const explicitBearing = Number(threat?.velocity?.bearingDeg ?? threat?.heading ?? threat?.bearing);

  // Резервные расчётные скорости используются только когда NEPTUN не передал velocity.
  // Они нужны, чтобы маркер не зависал между редкими координатными обновлениями.
  const defaults = {
    uav:       { speedKmh: 160, maxMinutes: 12 },
    recon:     { speedKmh: 120, maxMinutes: 10 },
    fpv:       { speedKmh: 90,  maxMinutes: 5 },
    missile:   { speedKmh: 780, maxMinutes: 3 },
    ballistic: { speedKmh: 0,   maxMinutes: 0 },
    kab:       { speedKmh: 650, maxMinutes: 4 },
    mig31k:    { speedKmh: 900, maxMinutes: 4 },
    unknown:   { speedKmh: 0,   maxMinutes: 0 }
  };
  const fallback = defaults[type] || defaults.unknown;

  return {
    speedKmh: Number.isFinite(explicitSpeed) && explicitSpeed > 0 ? explicitSpeed : fallback.speedKmh,
    bearingDeg: Number.isFinite(explicitBearing) ? explicitBearing : null,
    maxMinutes: Number.isFinite(explicitSpeed) && explicitSpeed > 0 ? 10 : fallback.maxMinutes,
    hasExplicitVelocity: Number.isFinite(explicitSpeed) && explicitSpeed > 0
  };
}

function predictedThreatPosition(threat, nowMs = Date.now()) {
  const lat = Number(threat?.lat);
  const lon = Number(threat?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const motion = fallbackMotionForThreat(threat);

  // SDK используем только когда в объекте есть настоящая скорость. Без velocity
  // NEPTUN.predict обычно возвращает исходную точку, поэтому маркер визуально зависает.
  if (motion.hasExplicitVelocity && window.NEPTUN && typeof window.NEPTUN.predict === 'function') {
    try {
      const predicted = window.NEPTUN.predict(threat, nowMs);
      const predictedLat = Number(predicted?.lat);
      const predictedLon = Number(predicted?.lon);
      if (Number.isFinite(predictedLat) && Number.isFinite(predictedLon)) {
        return {
          lat: predictedLat,
          lon: predictedLon,
          heading: Number.isFinite(Number(predicted?.heading))
            ? Number(predicted.heading)
            : (motion.bearingDeg ?? 0)
        };
      }
    } catch (error) {
      console.warn('NEPTUN.predict error, використовую локальний fallback:', error);
    }
  }

  if (!Number.isFinite(motion.speedKmh) || motion.speedKmh <= 0 || motion.bearingDeg === null) {
    return { lat, lon, heading: motion.bearingDeg ?? 0 };
  }

  // updatedAt важнее confirmedAt: движение считаем от последней фактической координаты.
  const anchor = Date.parse(threat.updatedAt || threat.confirmedAt || threat.createdAt || '');
  if (!Number.isFinite(anchor)) {
    return { lat, lon, heading: motion.bearingDeg };
  }

  const elapsedMinutes = Math.max(0, Math.min((nowMs - anchor) / 60000, motion.maxMinutes));
  const distanceKm = motion.speedKmh * (elapsedMinutes / 60);
  const p = destinationPoint(lat, lon, motion.bearingDeg, distanceKm);
  return { ...p, heading: motion.bearingDeg };
}

function threatsToGeoJSON(nowMs = Date.now()) {
  const features = currentThreats
    .filter(t => t && t.status !== 'resolved')
    .map(t => {
      const p = predictedThreatPosition(t, nowMs);
      if (!p) return null;
      const meta = threatMeta(t.type);
      const count = Number(t.count) > 1 ? ` ×${Number(t.count)}` : '';
      const location = t.locality || t.district || t.region || '';
      return {
        type: 'Feature',
        id: String(t.id || `${t.type}-${t.lat}-${t.lon}`),
        properties: {
          id: String(t.id || ''),
          type: t.type || 'unknown',
          title: t.title || meta.label,
          label: `${meta.short}${count}`,
          iconKey: meta.iconKey,
          color: meta.color,
          heading: Number.isFinite(Number(p.heading)) ? Number(p.heading) : 0,
          region: t.region || '',
          district: t.district || '',
          locality: location,
          confidence: t.confidenceLevel || '',
          sourceCount: Number(t.sourceCount) || 0,
          updatedAt: t.updatedAt || '',
          explanation: t.explanationShort || ''
        },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
      };
    })
    .filter(Boolean);
  return { type: 'FeatureCollection', features };
}

function trailsToGeoJSON() {
  const features = [];
  for (const t of currentThreats) {
    const points = Array.isArray(t?.trail) ? t.trail : [];
    const coordinates = points
      .map(p => [Number(p.lon), Number(p.lat)])
      .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
    if (coordinates.length < 2) continue;
    features.push({
      type: 'Feature',
      properties: { color: threatMeta(t.type).color, type: t.type || 'unknown' },
      geometry: { type: 'LineString', coordinates }
    });
  }
  return { type: 'FeatureCollection', features };
}

function createThreatMarkerElement(threat) {
  const meta = threatMeta(threat.type);
  const el = document.createElement('div');
  el.className = 'live-threat-marker';
  el.dataset.threatId = String(threat.id || '');
  el.style.setProperty('--threat-color', meta.color);

  const pulse = document.createElement('span');
  pulse.className = 'live-threat-pulse';

  const icon = document.createElement('span');
  icon.className = 'live-threat-icon';
  icon.innerHTML = threatIconSvg(meta.iconKey);

  const count = Number(threat.count) > 1 ? ` ×${Number(threat.count)}` : '';
  const label = document.createElement('span');
  label.className = 'live-threat-label';
  label.textContent = `${meta.short}${count}`;

  el.append(pulse, icon, label);
  return el;
}

function updateThreatMarkerContent(record, threat) {
  const meta = threatMeta(threat.type);
  record.el.style.setProperty('--threat-color', meta.color);
  const icon = record.el.querySelector('.live-threat-icon');
  const label = record.el.querySelector('.live-threat-label');
  if (icon) icon.innerHTML = threatIconSvg(meta.iconKey);
  if (label) {
    const count = Number(threat.count) > 1 ? ` ×${Number(threat.count)}` : '';
    label.textContent = `${meta.short}${count}`;
  }
  record.threat = threat;
}

function showThreatPopup(threat, marker) {
  const safe = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const updated = threat.updatedAt
    ? new Date(threat.updatedAt).toLocaleTimeString('uk-UA', { timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';
  const position = predictedThreatPosition(threat, Date.now());
  if (!position) return;
  new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 18 })
    .setLngLat([position.lon, position.lat])
    .setHTML(`<div class="threat-popup"><strong>${safe(threat.title || threatMeta(threat.type).label)}</strong><br>${safe(threat.locality || threat.district || threat.region || '')}<br>Курс: ${Math.round(Number(position.heading) || 0)}°<br>Джерел: ${Number(threat.sourceCount) || 0}<br>Оновлено: ${safe(updated)}${threat.explanationShort ? `<hr>${safe(threat.explanationShort)}` : ''}</div>`)
    .addTo(map);
}

function syncThreatMarkers() {
  const active = currentThreats.filter(t => t && t.status !== 'resolved' && Number.isFinite(Number(t.lat)) && Number.isFinite(Number(t.lon)));
  const activeIds = new Set();

  for (const threat of active) {
    const id = String(threat.id || `${threat.type}-${threat.lat}-${threat.lon}`);
    activeIds.add(id);
    let record = threatMarkers.get(id);
    if (!record) {
      const el = createThreatMarkerElement(threat);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([Number(threat.lon), Number(threat.lat)])
        .addTo(map);
      record = { marker, el, threat };
      el.addEventListener('click', event => {
        event.stopPropagation();
        showThreatPopup(record.threat, record.marker);
      });
      threatMarkers.set(id, record);
    } else {
      updateThreatMarkerContent(record, threat);
    }
  }

  for (const [id, record] of threatMarkers) {
    if (!activeIds.has(id)) {
      record.marker.remove();
      threatMarkers.delete(id);
    }
  }
}

function addNeptunThreatLayers() {
  // Траєкторії залишаються MapLibre-шаром, а самі цілі — DOM-маркерами.
  // Це усуває залежність від glyph/font-шарів і гарантує видимість значків.
  if (!map.getSource('neptun-threat-trails')) {
    map.addSource('neptun-threat-trails', { type: 'geojson', data: emptyFeatureCollection() });
    map.addLayer({
      id: 'neptun-threat-trails',
      type: 'line',
      source: 'neptun-threat-trails',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.3, 8, 2.5, 12, 3.8],
        'line-opacity': 0.68,
        'line-dasharray': [2, 2]
      }
    });
  }
}

function renderThreatsFrame() {
  const now = Date.now();
  for (const record of threatMarkers.values()) {
    const p = predictedThreatPosition(record.threat, now);
    if (!p) continue;
    record.marker.setLngLat([p.lon, p.lat]);
    const icon = record.el.querySelector('.live-threat-icon');
    if (icon) icon.style.transform = `rotate(${Number(p.heading) || 0}deg)`;
  }
  threatAnimationFrame = requestAnimationFrame(renderThreatsFrame);
}

async function fetchNeptunThreats() {
  try {
    const payload = await fetchJSON(`https://neptun.in.ua/api/v1/threats?t=${Date.now()}`);
    if (payload?.error) throw new Error(payload.error);
    currentThreats = Array.isArray(payload?.threats) ? payload.threats : [];
    syncThreatMarkers();
    map.getSource('neptun-threat-trails')?.setData(trailsToGeoJSON());
    const counter = document.getElementById('threatCount');
    if (counter) counter.textContent = `ЦІЛІ: ${currentThreats.length}`;
    console.log('NEPTUN active threats:', currentThreats.length, currentThreats);
  } catch (error) {
    console.warn('REST NEPTUN threats тимчасово недоступний:', error);
    const counter = document.getElementById('threatCount');
    if (counter) counter.textContent = 'ЦІЛІ: API НЕДОСТУПНИЙ';
  }
}

function applyThreatSnapshot(snapshot = {}) {
  currentThreats = Array.isArray(snapshot?.threats) ? snapshot.threats : [];
  syncThreatMarkers();
  map.getSource('neptun-threat-trails')?.setData(trailsToGeoJSON());
  const counter = document.getElementById('threatCount');
  if (counter) counter.textContent = `ЦІЛІ: ${currentThreats.length} • LIVE`;
}

function startNeptunThreats() {
  clearInterval(neptunThreatsTimer);
  neptunThreatsTimer = null;

  if (threatAnimationFrame !== null) cancelAnimationFrame(threatAnimationFrame);
  threatAnimationFrame = requestAnimationFrame(renderThreatsFrame);

  if (window.NEPTUN && typeof window.NEPTUN.RealtimeClient === 'function') {
    try {
      neptunRealtimeUnsubscribe?.();
      neptunRealtimeClient?.stop?.();

      neptunRealtimeClient = new window.NEPTUN.RealtimeClient('https://neptun.in.ua');
      neptunRealtimeUnsubscribe = neptunRealtimeClient.subscribe((snapshot) => {
        applyThreatSnapshot(snapshot);
        console.log('NEPTUN realtime snapshot:', currentThreats.length, currentThreats);
      });
      neptunRealtimeClient.start();
      return;
    } catch (error) {
      console.warn('WebSocket/SDK NEPTUN недоступний, переходжу на REST:', error);
    }
  }

  // Резервний режим, якщо SDK не завантажився.
  fetchNeptunThreats();
  neptunThreatsTimer = setInterval(fetchNeptunThreats, 5000);
}

function normalizeAdminToken(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenVariants(value = '') {
  const raw = normalizeAdminToken(value);
  if (!raw) return [];
  const variants = new Set([raw]);
  variants.add(raw.replace(/\s+(область|район)$/u, '').trim());
  variants.add(raw.replace(/^автономна\s+республіка\s+/u, '').trim());
  return [...variants].filter(Boolean);
}

function itemTokens(item) {
  if (typeof item === 'string') return new Set(tokenVariants(item));
  const values = [item?.key, item?.name, item?.oblast, item?.region, item?.district];
  return new Set(values.flatMap(tokenVariants));
}

function featureTokens(feature) {
  const p = feature?.properties || {};
  const values = [
    p.key, p.name, p.NAME_1, p.NAME_2, p.name_uk, p.name_ua,
    p.oblast, p.raion, p.district, p.region, p.admin_name,
    p.ADM1_UA, p.ADM2_UA, p.shapeName
  ];
  return new Set(values.flatMap(tokenVariants));
}

function featureMatchesItems(feature, items) {
  const fTokens = featureTokens(feature);
  if (!fTokens.size) return false;
  return items.some(item => {
    for (const token of itemTokens(item)) {
      if (fTokens.has(token)) return true;
    }
    return false;
  });
}

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] };
}

function applyNeptunAlerts(payload = {}) {
  const activeRaions = Array.isArray(payload.raions) ? payload.raions : [];
  const activeOblasts = Array.isArray(payload.oblasts) ? payload.oblasts : [];

  // Важно: районная тревога подсвечивает только район, а не всю область.
  // Целая область подсвечивается только тогда, когда она есть в payload.oblasts.
  const raionFeatures = (neptunRaionsGeoJSON?.features || []).filter(feature =>
    featureMatchesItems(feature, activeRaions)
  );
  const oblastFeatures = (neptunOblastsGeoJSON?.features || []).filter(feature =>
    featureMatchesItems(feature, activeOblasts)
  );

  map.getSource('neptun-alert-raions')?.setData({
    type: 'FeatureCollection',
    features: raionFeatures
  });
  map.getSource('neptun-alert-oblasts')?.setData({
    type: 'FeatureCollection',
    features: oblastFeatures
  });

  const live = document.querySelector('.live-status');
  if (live) {
    live.textContent = `● ТРИВОГИ: РАЙОНИ ${activeRaions.length}/${raionFeatures.length} | ОБЛАСТІ ${activeOblasts.length}/${oblastFeatures.length}`;
  }

  console.log('NEPTUN active raions:', activeRaions.map(x => x.key || x.name));
  console.log('NEPTUN matched raion polygons:', raionFeatures.length);
  console.log('NEPTUN active oblasts:', activeOblasts.map(x => x.key || x.name));
  console.log('NEPTUN matched oblast polygons:', oblastFeatures.length);
}

async function fetchJSON(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function loadNeptunBoundaries() {
  const [oblasts, raions] = await Promise.all([
    fetchJSON('https://neptun.in.ua/oblasts.geojson'),
    fetchJSON('https://neptun.in.ua/raions.geojson')
  ]);
  if (oblasts?.type !== 'FeatureCollection' || !Array.isArray(oblasts.features)) {
    throw new Error('Некоректний oblasts.geojson');
  }
  if (raions?.type !== 'FeatureCollection' || !Array.isArray(raions.features)) {
    throw new Error('Некоректний raions.geojson');
  }
  neptunOblastsGeoJSON = oblasts;
  neptunRaionsGeoJSON = raions;
  console.log('NEPTUN polygons loaded:', {
    oblasts: oblasts.features.length,
    raions: raions.features.length,
    oblastSample: oblasts.features[0]?.properties,
    raionSample: raions.features[0]?.properties
  });
}

function addNeptunAlertLayers() {
  map.addSource('neptun-alert-oblasts', { type: 'geojson', data: emptyFeatureCollection() });
  map.addSource('neptun-alert-raions', { type: 'geojson', data: emptyFeatureCollection() });

  map.addLayer({
    id: 'neptun-oblast-alert-fill',
    type: 'fill',
    source: 'neptun-alert-oblasts',
    paint: {
      'fill-color': '#ff0000',
      'fill-opacity': 0.18,
      'fill-outline-color': '#ff4a4a'
    }
  });
  map.addLayer({
    id: 'neptun-raion-alert-fill',
    type: 'fill',
    source: 'neptun-alert-raions',
    paint: {
      'fill-color': '#ff0000',
      'fill-opacity': 0.18,
      'fill-outline-color': '#ff4a4a'
    }
  });
  map.addLayer({
    id: 'neptun-raion-alert-border',
    type: 'line',
    source: 'neptun-alert-raions',
    paint: {
      'line-color': '#ff6a6a',
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.15, 12, 1.8],
      'line-opacity': 0.95
    }
  });
}

async function fetchNeptunAlerts() {
  try {
    const payload = await fetchJSON('https://neptun.in.ua/api/v1/alerts');
    applyNeptunAlerts(payload);
  } catch (error) {
    console.warn('REST NEPTUN тимчасово недоступний:', error);
    const live = document.querySelector('.live-status');
    if (live) live.textContent = '● API ТРИВОГ НЕДОСТУПНИЙ';
  }
}

function startNeptunAlerts() {
  fetchNeptunAlerts();
  clearInterval(neptunRestTimer);
  neptunRestTimer = setInterval(fetchNeptunAlerts, 7000);
}

const REGION_BASES = [
  './data/',
  'https://cdn.jsdelivr.net/gh/EugeneBorshch/ukraine_geojson@master/',
  'https://raw.githubusercontent.com/EugeneBorshch/ukraine_geojson/refs/heads/master/'
];

const OBLAST_LABELS = {
  type: 'FeatureCollection',
  features: [
    ['Волинська область', 24.72, 51.12],
    ['Рівненська область', 26.25, 51.04],
    ['Житомирська область', 28.47, 50.67],
    ['Київська область', 30.33, 50.20],
    ['Чернігівська область', 31.85, 51.17],
    ['Сумська область', 34.03, 50.98],
    ['Львівська область', 24.02, 49.82],
    ['Тернопільська область', 25.58, 49.52],
    ['Хмельницька область', 27.02, 49.42],
    ['Вінницька область', 28.73, 49.12],
    ['Черкаська область', 31.55, 49.05],
    ['Полтавська область', 34.02, 49.55],
    ['Харківська область', 36.45, 49.55],
    ['Закарпатська область', 23.20, 48.40],
    ['Івано-Франківська область', 24.72, 48.72],
    ['Чернівецька область', 25.93, 48.25],
    ['Кіровоградська область', 32.02, 48.35],
    ['Дніпропетровська область', 35.03, 48.32],
    ['Донецька область', 37.72, 48.02],
    ['Луганська область', 39.05, 48.95],
    ['Одеська область', 30.18, 46.72],
    ['Миколаївська область', 32.15, 47.02],
    ['Херсонська область', 34.08, 46.70],
    ['Запорізька область', 35.72, 47.20],
    ['Автономна Республіка Крим', 34.15, 45.25]
  ].map(([name, lng, lat]) => ({
    type: 'Feature',
    properties: { name },
    geometry: { type: 'Point', coordinates: [lng, lat] }
  }))
};

const clockEl = document.getElementById('countdown');
const dateEl = document.getElementById('timerState');
function updateUkraineTime() {
  const now = new Date();
  clockEl.textContent = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(now);
  dateEl.textContent = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(now);
}
updateUkraineTime();
setInterval(updateUkraineTime, 1000);

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [{
      id: 'base-map',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': -1,
        'raster-contrast': 0.14,
        'raster-brightness-min': 0.18,
        'raster-brightness-max': 0.92
      }
    }]
  },
  center: UKRAINE,
  zoom: DEFAULT_ZOOM,
  attributionControl: false,
  maxZoom: 19,
  minZoom: 3
});

let returnTimer;
function startReturnTimer() {
  clearTimeout(returnTimer);
  returnTimer = setTimeout(() => returnToUkraine(true), RETURN_DELAY);
}
function returnToUkraine(animated = true) {
  clearTimeout(returnTimer);
  map[animated ? 'easeTo' : 'jumpTo']({
    center: UKRAINE,
    zoom: DEFAULT_ZOOM,
    pitch: 0,
    bearing: 0,
    duration: animated ? 1500 : 0,
    essential: true
  });
  setTimeout(startReturnTimer, animated ? 1550 : 0);
}

async function loadRegionsGeoJSON() {
  const cached = localStorage.getItem('ukraine-oblasts-geojson-v3');
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (data?.type === 'FeatureCollection' && data.features?.length >= 24) {
        data.features.forEach((feature, index) => {
          feature.properties = feature.properties || {};
          feature.properties.neptunKey = feature.properties.neptunKey || REGION_NEPTUN_KEYS[index];
        });
        return data;
      }
    } catch (_) {}
  }

  let lastError;
  for (const base of REGION_BASES) {
    try {
      const responses = await Promise.all(REGION_FILES.map(async file => {
        const response = await fetch(base + file, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
        return response.json();
      }));

      const features = responses.flatMap((data, index) => {
        let items = [];
        if (data?.type === 'FeatureCollection') items = data.features || [];
        else if (data?.type === 'Feature') items = [data];
        else if (data?.type === 'Polygon' || data?.type === 'MultiPolygon') {
          items = [{ type: 'Feature', properties: {}, geometry: data }];
        }

        return items.map(feature => ({
          ...feature,
          properties: {
            ...(feature.properties || {}),
            sourceFile: REGION_FILES[index],
            neptunKey: REGION_NEPTUN_KEYS[index]
          }
        }));
      }).filter(feature => ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type));

      if (features.length < 24) throw new Error(`Отримано лише ${features.length} областей`);

      const result = { type: 'FeatureCollection', features };
      try { localStorage.setItem('ukraine-oblasts-geojson-v3', JSON.stringify(result)); } catch (_) {}
      return result;
    } catch (error) {
      lastError = error;
      console.warn('Джерело меж областей недоступне:', base, error);
    }
  }
  throw lastError || new Error('Не вдалося завантажити межі областей');
}

function addRegionLayers(regionsData) {
  regionsGeoJSON = regionsData;
  regionsGeoJSON.features.forEach(feature => {
    feature.properties = feature.properties || {};
    feature.properties.alert = false;
  });

  map.addSource('ukraine-regions', {
    type: 'geojson',
    data: regionsData,
    generateId: true
  });


  map.addLayer({
    id: 'oblast-fill',
    type: 'fill',
    source: 'ukraine-regions',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false], '#bfff68',
        '#65ff83'
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false], 0.16,
        ['interpolate', ['linear'], ['zoom'], 4, 0.075, 7, 0.045, 12, 0.018]
      ]
    }
  });

  // Чёрная подложка не даёт границам потеряться на светлой карте.
  map.addLayer({
    id: 'oblast-border-casing',
    type: 'line',
    source: 'ukraine-regions',
    paint: {
      'line-color': '#440000',
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.1, 8, 1.2, 12, 1.35, 16, 1.5],
      'line-opacity': 0.10,
      'line-blur': 0.2
    }
  });

  // Основной хорошо заметный контур реальных областей.
  map.addLayer({
    id: 'oblast-border-main',
    type: 'line',
    source: 'ukraine-regions',
    paint: {
      'line-color': [
        'case',
        ['boolean', ['get', 'alert'], false], '#ff3030',
        '#ff1f1f'
      ],
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.65, 8, 0.72, 12, 0.82, 16, 0.95],
      'line-opacity': [
        'case',
        ['boolean', ['get', 'alert'], false], 0.95,
        0.32
      ]
    }
  });

  // Тонкая зелёная сердцевина создаёт радарное свечение.
  map.addLayer({
    id: 'oblast-border-core',
    type: 'line',
    source: 'ukraine-regions',
    paint: {
      'line-color': '#ff0000',
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.22, 8, 0.28, 12, 0.34, 16, 0.42],
      'line-opacity': 0.18
    }
  });

  map.addSource('oblast-labels', { type: 'geojson', data: OBLAST_LABELS });
  map.addLayer({
    id: 'oblast-label-layer',
    type: 'symbol',
    source: 'oblast-labels',
    minzoom: 4.15,
    maxzoom: 11,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 4.2, 10.5, 6, 12.5, 8, 14.5],
      'text-transform': 'uppercase',
      'text-letter-spacing': 0.04,
      'text-max-width': 10,
      'text-allow-overlap': false,
      'text-ignore-placement': false
    },
    paint: {
      'text-color': '#efffd3',
      'text-halo-color': '#220000',
      'text-halo-width': 2.8,
      'text-halo-blur': 0.35
    }
  });

  let hoveredRegionId = null;
  map.on('mousemove', 'oblast-fill', event => {
    if (!event.features?.length) return;
    if (hoveredRegionId !== null) {
      map.setFeatureState({ source: 'ukraine-regions', id: hoveredRegionId }, { hover: false });
    }
    hoveredRegionId = event.features[0].id;
    map.setFeatureState({ source: 'ukraine-regions', id: hoveredRegionId }, { hover: true });
    map.getCanvas().style.cursor = 'crosshair';
  });
  map.on('mouseleave', 'oblast-fill', () => {
    if (hoveredRegionId !== null) {
      map.setFeatureState({ source: 'ukraine-regions', id: hoveredRegionId }, { hover: false });
    }
    hoveredRegionId = null;
    map.getCanvas().style.cursor = '';
  });

  document.body.classList.add('regions-ready');
}

map.on('load', async () => {
  try {
    const [regionsData] = await Promise.all([
      loadRegionsGeoJSON(),
      loadNeptunBoundaries()
    ]);
    addRegionLayers(regionsData);
    addNeptunAlertLayers();
    addNeptunThreatLayers();
    startNeptunAlerts();
    startNeptunThreats();
  } catch (error) {
    console.error('Дані карти або межі NEPTUN не завантажено:', error);
    const live = document.querySelector('.live-status');
    if (live) live.textContent = '● MAP DATA ERROR';
  }

  startReturnTimer();
  map.fire('move');
});


['dragstart', 'zoomstart', 'rotatestart', 'pitchstart'].forEach(name => map.on(name, () => clearTimeout(returnTimer)));
['dragend', 'zoomend', 'rotateend', 'pitchend'].forEach(name => map.on(name, startReturnTimer));

map.on('mousemove', (event) => {
  const { lng, lat } = event.lngLat;
  document.getElementById('coords').textContent = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'} / ${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
});
map.on('resize', () => map.fire('move'));
document.getElementById('homeBtn').addEventListener('click', () => returnToUkraine(true));
document.getElementById('styleBtn').addEventListener('click', () => document.body.classList.toggle('alt'));
window.addEventListener('resize', () => map.resize());


// Telegram news feed: @zalizne_nebo
const telegramFeed = document.getElementById('telegramFeed');
const telegramFeedList = document.getElementById('telegramFeedList');
const telegramFeedStatus = document.getElementById('telegramFeedStatus');
const telegramFeedToggle = document.getElementById('telegramFeedToggle');
const telegramFeedTab = document.getElementById('telegramFeedTab');

function escapeTelegramText(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function formatTelegramTime(iso) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function renderTelegramNews(items) {
  telegramFeedList.innerHTML = '';
  if (!Array.isArray(items) || !items.length) {
    telegramFeedStatus.textContent = 'НОВИН НЕ ЗНАЙДЕНО';
    return;
  }
  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => {
    const link = document.createElement('a');
    link.className = 'telegram-news-item';
    link.href = item.url || 'https://t.me/zalizne_nebo';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = `
      <div class="telegram-news-item__meta">
        <span>ПОВІДОМЛЕННЯ ${String(index + 1).padStart(2, '0')}</span>
        <time>${escapeTelegramText(formatTelegramTime(item.datetime))}</time>
      </div>
      <div class="telegram-news-item__text">${escapeTelegramText(item.text)}</div>`;
    fragment.appendChild(link);
  });
  telegramFeedList.appendChild(fragment);
  telegramFeedList.scrollTop = telegramFeedList.scrollHeight;
  telegramFeedStatus.textContent = `ОНОВЛЕНО · ${formatTelegramTime(new Date().toISOString())}`;
}

async function loadTelegramNews() {
  telegramFeedStatus.textContent = 'ОНОВЛЕННЯ СТРІЧКИ...';
  try {
    const response = await fetch('https://neptun.in.ua/api/v1/messages', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const items = messages
      .filter((item) => {
        const channel = String(item.channel || '').toLowerCase().replace(/^@/, '');
        return !channel || channel === 'zalizne_nebo';
      })
      .slice(-10)
      .map((item) => ({
        text: item.text || '',
        datetime: item.date || item.datetime || '',
        url: item.url || 'https://t.me/zalizne_nebo'
      }));
    renderTelegramNews(items);
  } catch (error) {
    console.warn('Telegram feed error:', error);
    telegramFeedStatus.textContent = 'НЕ ВДАЛОСЯ ОТРИМАТИ НОВИНИ';
    if (!telegramFeedList.children.length) {
      telegramFeedList.innerHTML = '<a class="telegram-news-item" href="https://t.me/zalizne_nebo" target="_blank" rel="noopener noreferrer"><div class="telegram-news-item__text">Натисніть, щоб відкрити канал @zalizne_nebo у Telegram.</div></a>';
    }
  }
}

function setTelegramFeedHidden(hidden) {
  telegramFeed.classList.toggle('is-hidden', hidden);
  telegramFeedTab.classList.toggle('is-visible', hidden);
  try { localStorage.setItem('telegram-feed-hidden', hidden ? '1' : '0'); } catch (_) {}
}

telegramFeedToggle?.addEventListener('click', () => setTelegramFeedHidden(true));
telegramFeedTab?.addEventListener('click', () => setTelegramFeedHidden(false));
setTelegramFeedHidden(localStorage.getItem('telegram-feed-hidden') === '1');
loadTelegramNews();
setInterval(loadTelegramNews, 10000);
