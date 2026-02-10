// ---------- Address cache ----------
const addressCache = {}; // key = "lat,lng", value = address string

export const fetchAddress = async ({ lat, lng }) => {
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`; // round to avoid duplicates
  if (addressCache[key]) {
    return addressCache[key];
  }

  try {
    // Mapbox reverse geocoding API
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    );
    const data = await res.json();
    const place = data.features?.[0]?.place_name || "Unknown address";
    addressCache[key] = place;
    return place;
  } catch (e) {
    console.error("Failed to fetch address:", e);
    return "Unknown address";
  }
};

// ---------- Distance calculation ----------
export const haversine = (a, b) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
};
