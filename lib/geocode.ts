// Free place search via OpenStreetMap Nominatim (no API key, no billing).
// Low-volume use only; sends a descriptive User-Agent per their usage policy.

export interface GeoResult {
  name: string;
  sub: string;
  lat: number;
  lng: number;
}

export async function searchPlaces(query: string): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KeptApp/1.0 (habit tracker)', Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return data.map((d) => {
      const parts = String(d.display_name || '').split(',').map((s: string) => s.trim());
      return {
        name: parts[0] || q,
        sub: parts.slice(1, 3).join(', '),
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
      };
    });
  } catch {
    return [];
  }
}
