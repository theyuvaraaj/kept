// Place search. Priority: Mappls (MapmyIndia — great India coverage, free tier)
// → Google Places (if key) → Photon (free OSM fallback). Configure whichever
// you have via env; without any, Photon is used.

export interface GeoResult {
  name: string;
  sub: string;
  lat: number;
  lng: number;
}

const MAPPLS_ID = process.env.EXPO_PUBLIC_MAPPLS_CLIENT_ID ?? '';
const MAPPLS_SECRET = process.env.EXPO_PUBLIC_MAPPLS_CLIENT_SECRET ?? '';
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';
export const hasMappls = Boolean(MAPPLS_ID && MAPPLS_SECRET);
export const hasGooglePlaces = Boolean(GOOGLE_KEY);

export async function searchPlaces(
  query: string,
  near?: { lat: number; lng: number }
): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  if (hasMappls) {
    try {
      const r = await mapplsSearch(q, near);
      if (r.length) return r;
    } catch {}
  }
  if (GOOGLE_KEY) {
    try {
      const r = await googleSearch(q, near);
      if (r.length) return r;
    } catch {}
  }
  return photonSearch(q, near);
}

/* ---------------- Mappls (MapmyIndia) ---------------- */

let tokenCache: { token: string; exp: number } | null = null;

async function mapplsToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 10000) return tokenCache.token;
  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(MAPPLS_ID)}&client_secret=${encodeURIComponent(MAPPLS_SECRET)}`;
  const res = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const d: any = await res.json();
  if (!d.access_token) throw new Error('mappls token failed');
  tokenCache = { token: d.access_token, exp: Date.now() + (d.expires_in || 3600) * 1000 };
  return d.access_token;
}

async function mapplsSearch(q: string, near?: { lat: number; lng: number }): Promise<GeoResult[]> {
  const token = await mapplsToken();
  let url = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(q)}`;
  if (near) url += `&location=${near.lat},${near.lng}`;
  const res = await fetch(url, { headers: { Authorization: `bearer ${token}` } });
  if (!res.ok) return [];
  const d: any = await res.json();
  return (d?.suggestedLocations ?? [])
    .map((s: any) => ({
      name: s.placeName || q,
      sub: s.placeAddress || '',
      lat: Number(s.latitude ?? s.entryLatitude),
      lng: Number(s.longitude ?? s.entryLongitude),
    }))
    .filter((r: GeoResult) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
    .slice(0, 6);
}

/* ---------------- Google Places (New) ---------------- */

async function googleSearch(q: string, near?: { lat: number; lng: number }): Promise<GeoResult[]> {
  const body: any = { textQuery: q, maxResultCount: 6 };
  if (near) body.locationBias = { circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 50000 } };
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];
  const data: any = await res.json();
  return (data.places ?? []).slice(0, 6).map((p: any) => ({
    name: p.displayName?.text || q,
    sub: p.formattedAddress || '',
    lat: p.location.latitude,
    lng: p.location.longitude,
  }));
}

/* ---------------- Photon (free OSM fallback) ---------------- */

async function photonSearch(q: string, near?: { lat: number; lng: number }): Promise<GeoResult[]> {
  let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`;
  if (near) url += `&lat=${near.lat}&lon=${near.lng}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'KeptApp/1.0 (habit tracker)' } });
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data?.features ?? [])
      .filter((f: any) => f?.geometry?.coordinates?.length === 2)
      .map((f: any) => {
        const p = f.properties ?? {};
        const [lng, lat] = f.geometry.coordinates;
        const name = p.name || p.street || p.city || q;
        const sub = [p.street && p.street !== name ? p.street : null, p.city, p.state, p.country]
          .filter(Boolean)
          .slice(0, 3)
          .join(', ');
        return { name, sub, lat, lng };
      });
  } catch {
    return [];
  }
}
