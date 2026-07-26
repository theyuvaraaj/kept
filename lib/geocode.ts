// Place search. Uses Google Places (New) Text Search when a key is configured
// (Google-Maps-quality results incl. small businesses), and falls back to Photon
// (free OSM, weaker coverage) when there's no key.

export interface GeoResult {
  name: string;
  sub: string;
  lat: number;
  lng: number;
}

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';
export const hasGooglePlaces = Boolean(GOOGLE_KEY);

export async function searchPlaces(
  query: string,
  near?: { lat: number; lng: number }
): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  if (GOOGLE_KEY) {
    try {
      const r = await googleSearch(q, near);
      if (r.length) return r;
    } catch {
      // fall through to Photon
    }
  }
  return photonSearch(q, near);
}

async function googleSearch(q: string, near?: { lat: number; lng: number }): Promise<GeoResult[]> {
  const body: any = { textQuery: q, maxResultCount: 6 };
  if (near) {
    body.locationBias = { circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 50000 } };
  }
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
