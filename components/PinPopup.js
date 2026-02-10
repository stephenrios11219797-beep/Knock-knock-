// PinPopup.js
import mapboxgl from "mapbox-gl";

export default function PinPopup(pin, map, onEdit) {
  const popup = new mapboxgl.Popup({ offset: 25, closeOnClick: false })
    .setHTML(`
      <strong>Status:</strong> ${pin.status}<br/>
      <strong>Severity:</strong> ${pin.severity ?? "N/A"}<br/>
      <strong>Notes:</strong> ${pin.notes ?? "None"}<br/>
      <strong>Address:</strong> ${pin.address ?? "Unknown"}<br/>
      <button id="edit-pin-btn">Edit</button>
    `)
    .setLngLat([pin.lngLat.lng, pin.lngLat.lat])
    .addTo(map);

  setTimeout(() => {
    const editBtn = document.getElementById("edit-pin-btn");
    if (editBtn) editBtn.onclick = () => onEdit(pin);
  }, 0);

  return popup;
}
