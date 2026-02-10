// /components/utils.js
const addressCache = {}; // key = "lat,lng", value = address string

export const fetchAddress = async ({ lat, lng }) => {
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`; // round to reduce duplicates
  if (addressCache[key]) {
    return addressCache[key];
  }

  try {
    // Example: Mapbox reverse geocoding API
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
