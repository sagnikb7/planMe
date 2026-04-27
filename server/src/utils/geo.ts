import geoip from 'geoip-lite';

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function isPrivateIp(ip: string): boolean {
  const clean = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  return PRIVATE_RANGES.some((re) => re.test(clean));
}

export function lookupLocation(ip: string): string {
  if (!ip) return 'Unknown location';
  if (isPrivateIp(ip)) return 'Local';

  const clean = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const geo = geoip.lookup(clean);
  if (!geo) return 'Unknown location';

  const parts = [geo.city, geo.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown location';
}
