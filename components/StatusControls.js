export default function StatusControls({ showStatus, STATUS_OPTIONS, onSelect, onCancel }) {
  if (!showStatus) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        left: "50%",
        transform: "translateX(-50%)",
        background: "white",
        padding: 10,
        borderRadius: 12,
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        zIndex: 100,
      }}
    >
      {STATUS_OPTIONS.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s)} // <<< Pass the FULL status object
          style={{
            background: s.color,
            color: "white",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {s.label}
        </button>
      ))}

      <button
        onClick={onCancel}
        style={{
          background: "#e5e7eb",
          color: "#111",
          padding: "6px 10px",
          borderRadius: 6,
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );
}
