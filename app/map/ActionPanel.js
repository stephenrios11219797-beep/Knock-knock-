"use client";

export default function ActionPanel() {
  return (
    <div style={panelStyle}>
      <button onClick={() => window.logHouse()}>
        Log House
      </button>
    </div>
  );
}

const panelStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "#fff",
  padding: "12px",
  borderTop: "1px solid #ddd",
  zIndex: 10,
};
