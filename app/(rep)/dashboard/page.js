export default function RepDashboard() {
  return (
    <main style={{ padding: "24px" }}>
      <h1>Rep Dashboard</h1>

      <section>
        <h2>Door-to-Door</h2>
        <ul>
          <li>Knocks</li>
          <li>Talks</li>
          <li>Walks (Roof Walks)</li>
          <li>No Answer</li>
        </ul>
      </section>

      <section>
        <h2>Contingencies</h2>
        <ul>
          <li>Homeowner Name</li>
        </ul>
      </section>

      <section>
        <h2>Contracts</h2>
        <ul>
          <li>Homeowner Name</li>
          <li>Contract Value</li>
        </ul>
      </section>

      <section>
        <h2>Retail</h2>
        <ul>
          <li>Retail Appointments</li>
          <li>Retail Contracts</li>
          <li>Retail Contract Value</li>
          <li>Retail Close Rate</li>
        </ul>
      </section>
    </main>
  );
}
