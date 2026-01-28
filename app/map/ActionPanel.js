"use client";

export default function ActionPanel() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 140,
        left: 16,
        zIndex: 9999,
        background: "red",
        color: "white",
        padding: 16,
        borderRadius: 8,
        fontSize: 16,
      }}
    >
      ACTION PANEL IS RENDERING
    </div>
  );
}
