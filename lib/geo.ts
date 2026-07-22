// Haversine distance in metres.
export function distanceM(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371000;
  const t = (x: number) => (x * Math.PI) / 180;
  const dLa = t(la2 - la1);
  const dLo = t(lo2 - lo1);
  const a =
    Math.sin(dLa / 2) ** 2 + Math.cos(t(la1)) * Math.cos(t(la2)) * Math.sin(dLo / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
