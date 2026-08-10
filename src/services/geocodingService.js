/**
 * Geocoding service using OpenStreetMap APIs (Nominatim + Photon fallback)
 * - Miễn phí hoàn toàn, không cần API Key
 * - Chiến lược song song: Nominatim (ưu tiên dữ liệu chính xác) + Photon (fallback nhanh)
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const PHOTON_BASE    = 'https://photon.komoot.io/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Trích xuất số nhà từ đầu query. VD: "16A Nguyễn Chí Thanh" → "16A" */
const extractHouseNumber = (query) => {
  const m = query.trim().match(/^(\d+[A-Za-zÀ-ỹ]?(?:\/\d+[A-Za-z]?)?)\b/);
  return m ? m[1] : null;
};

/** Phân tích query thành {housenumber, street, city} cho structured search */
const parseStructured = (query, houseNumber) => {
  if (!houseNumber) return null;

  // Xóa số nhà ở đầu để lấy phần còn lại
  const rest = query.replace(/^[\d]+[A-Za-zÀ-ỹ]?(?:\/\d+[A-Za-z]?)?\s*/, '').trim();
  const parts = rest.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  return {
    housenumber: houseNumber,
    street: parts[0],
    city: parts[1] || '',
  };
};

/** Làm sạch query: xóa đơn vị hành chính vi mô, mã bưu chính, "Việt Nam" */
const preprocessQuery = (query) =>
  query
    .replace(/\b\d{5,6}\b/g, '')
    .replace(/,?\s*Khu\s+Ph[ôố]\s*\d*/gi, '')
    .replace(/,?\s*(T[ổổ]|Thôn)\s+\d+/gi, '')
    .replace(/,?\s*Ph[ươ][ờở]ng\s+\d+/gi, '')
    .replace(/,?\s*Qu[aậ]n\s+\d+/gi, (m) => m) // giữ Quận có số
    .replace(/,?\s*(Vi[eệ]t\s*Nam|Vietnam)\s*$/gi, '')
    .replace(/,\s*,+/g, ',')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizeNominatim = (item, houseNumber) => {
  const addr  = item.address || {};
  const street = addr.road || addr.pedestrian || addr.path || addr.street || '';
  const hn     = addr.house_number || houseNumber;

  const short = [
    hn ? `${hn} ${street}`.trim() : street,
    (item.name && item.name !== street) ? item.name : null,
    addr.suburb || addr.neighbourhood || addr.quarter,
    addr.city_district,
    addr.city || addr.town || addr.village || addr.county,
    addr.state,
  ].filter(Boolean).join(', ');

  const typeMap = {
    house: 'Số nhà', building: 'Tòa nhà', amenity: 'Địa điểm',
    road: 'Đường', residential: 'Đường', street: 'Đường',
    administrative: 'Khu vực', city: 'Thành phố', town: 'Thị xã',
    village: 'Xã/Phường', suburb: 'Phường', quarter: 'Khu vực',
  };
  const typeLabel = typeMap[item.type] || typeMap[item.category] || 'Địa điểm';

  return {
    place_id:     `nom_${item.place_id}`,
    display_name: short || item.display_name,
    address:      short || item.display_name,
    city:         addr.city || addr.town || addr.village || addr.county || '',
    province:     addr.state || '',
    typeLabel,
    lat: String(item.lat),
    lon: String(item.lon),
  };
};

const normalizePhoton = (feature, houseNumber) => {
  const p   = feature.properties;
  const [lon, lat] = feature.geometry.coordinates;

  const isRoad = p.type === 'street' || p.osm_key === 'highway';
  const hn     = p.housenumber || (isRoad ? houseNumber : null);

  const streetDisplay = isRoad
    ? (hn ? `${hn} ${p.name}`.trim() : p.name)
    : p.name;

  const short = [
    streetDisplay,
    !isRoad && p.street ? p.street : null,
    p.locality,
    p.district,
    p.city || p.town || p.village,
    p.state,
  ].filter(Boolean).join(', ');

  const typeMap = {
    house: 'Số nhà', building: 'Tòa nhà', street: 'Đường',
    city: 'Thành phố', town: 'Thị xã', village: 'Xã/Phường',
    locality: 'Khu vực', district: 'Quận/Huyện', country: 'Quốc gia',
  };
  const typeLabel = typeMap[p.type] || (isRoad ? 'Đường' : 'Địa điểm');

  return {
    place_id:     `ph_${p.osm_type}_${p.osm_id}`,
    display_name: short,
    address:      short,
    city:         p.city || p.town || p.village || '',
    province:     p.state || '',
    typeLabel,
    lat: String(lat),
    lon: String(lon),
  };
};

// ─── API Callers ───────────────────────────────────────────────────────────────

const fetchNominatimFreeform = async (query, limit, houseNumber, signal) => {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'vn',
    'accept-language': 'vi,en',
  });
  const res = await fetch(`${NOMINATIM_BASE}?${params}`, { signal });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  return (data || []).map(item => normalizeNominatim(item, houseNumber));
};

const fetchNominatimStructured = async (parsed, limit, houseNumber, signal) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'vn',
    'accept-language': 'vi,en',
    housenumber: parsed.housenumber,
    street: parsed.street,
    ...(parsed.city ? { city: parsed.city } : {}),
  });
  const res = await fetch(`${NOMINATIM_BASE}?${params}`, { signal });
  if (!res.ok) throw new Error(`Nominatim structured ${res.status}`);
  const data = await res.json();
  return (data || []).map(item => normalizeNominatim(item, houseNumber));
};

const fetchPhoton = async (query, limit, houseNumber, signal) => {
  const params = new URLSearchParams({ q: query, limit: String(limit), lang: 'en' });
  const res = await fetch(`${PHOTON_BASE}?${params}`, { signal });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  return (data.features || []).map(f => normalizePhoton(f, houseNumber));
};

// ─── Dedup ────────────────────────────────────────────────────────────────────

const deduplicate = (items) => {
  const seen = [];
  return items.filter(item => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const isDup = seen.some(s => Math.abs(s.lat - lat) < 0.0005 && Math.abs(s.lon - lon) < 0.0005);
    if (!isDup) seen.push({ lat, lon });
    return !isDup;
  });
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Tìm kiếm địa chỉ bằng cách kết hợp Nominatim & Photon.
 * Không cần API Key.
 *
 * @param {string} query  - Địa chỉ cần tìm
 * @param {number} limit  - Số lượng kết quả tối đa
 */
export const searchAddress = async (query, limit = 5) => {
  const houseNumber = extractHouseNumber(query);
  const cleanQuery  = preprocessQuery(query);
  const structured  = parseStructured(cleanQuery, houseNumber);

  const ctrl = {
    structured: new AbortController(),
    freeform:   new AbortController(),
    photon:     new AbortController(),
  };

  const t1 = setTimeout(() => ctrl.structured.abort(), 3000);
  const t2 = setTimeout(() => ctrl.freeform.abort(),   3000);

  const run = async (fn) => { try { return await fn(); } catch { return []; } };

  const [structuredRes, freeformRes, photonRes] = await Promise.all([
    structured
      ? run(() => fetchNominatimStructured(structured, limit, houseNumber, ctrl.structured.signal)).then(r => { clearTimeout(t1); return r; })
      : Promise.resolve([]),
    run(() => fetchNominatimFreeform(cleanQuery, limit, houseNumber, ctrl.freeform.signal)).then(r => { clearTimeout(t2); return r; }),
    run(() => fetchPhoton(cleanQuery, limit, houseNumber, ctrl.photon.signal)),
  ]);

  const merged = deduplicate([...structuredRes, ...freeformRes, ...photonRes]);
  return merged.slice(0, limit);
};

export default { searchAddress };
