export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#020617",
        color: "#f8fafc",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "12px" }}>
        Knock Knock, Who’s There
      </h1>

      <p style={{ opacity: 0.8, marginBottom: "24px" }}>
        Door-to-door sales tracking
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <a href="/rep" style={button}>
          Rep Dashboard
        </a>
        <a href="/manager" style={buttonSecondary}>
          Manager Dashboard
        </a>
      </div>
    </main>
  );
}

const button = {
  padding: "12px 18px",
  borderRadius: "10px",
  background: "#22c55e",
  color: "#020617",
  textDecoration: "none",
  fontWeight: 600,
};

const buttonSecondary = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "1px solid #22c55e",
  color: "#22c55e",
  textDecoration: "none",
  fontWeight: 600,
};
