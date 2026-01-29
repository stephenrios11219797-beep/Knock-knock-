"use client";

export default function ActionPanel({ onLogHouse }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
      }}
    >
      <button
        onClick={onLogHouse}
        style={{
          background: "white",
          padding: "12px 18px",
          borderRadius: 999,
          fontSize: 16,
        }}
      >
        Log House
      </button>
    </div>
  );
}
