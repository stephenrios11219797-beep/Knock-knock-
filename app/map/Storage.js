// Storage.js
export const todayKey = () => new Date().toISOString().slice(0, 10);

export const loadAllPins = () =>
  JSON.parse(localStorage.getItem("pins") || "{}");

export const saveAllPins = (data) =>
  localStorage.setItem("pins", JSON.stringify(data));

export const savePinToStorage = (pin) => {
  const all = loadAllPins();
  const today = todayKey();
  all[today] = [...(all[today] || []), pin];
  saveAllPins(all);
};
