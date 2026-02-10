import mapboxgl from "mapbox-gl";
import PinPopup from "./PinPopup";

export const createPinElement = (color) => {
  const el = document.createElement("div");
  el.style.padding = "14px";
  el.style.cursor = "pointer";
  el.innerHTML = `
    <svg width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
        fill="${color}" />
      <circle cx="12" cy="12" r="4" fill="white" />
    </svg>
  `;
  el.style.transform = "translate(-50%, -100%)";
  return el;
};

export const addPinToMap = async (map, pin, onEdit) => {
  const markerEl = createPinElement(pin.color);
  const marker = new mapboxgl.Marker({ element: markerEl }).setLngLat(pin.lngLat).addTo(map);

  marker.getElement().addEventListener("click", (e) => {
    e.stopPropagation();
    PinPopup(pin, map, onEdit);
  });

  return marker;
};
