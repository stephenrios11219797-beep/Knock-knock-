"use client";

import { useEffect, useState } from "react";

export default function ManagerPage() {
  const [rep, setRep] = useState("Rep 1");
  const [data, setData] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`repData-${rep}`));
    if (saved) {
      setData(saved);
    } else {
      setData(null);
    }
  }, [rep]);

  return (
    <main>
      <h1>Manager Dashboard</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          <strong>Select Rep:</strong>{" "}
          <select value={rep} onChange={(e) => setRep(e.target.value)}>
            <option>Rep 1</option>
            <option>Rep 2</option>
            <option>Rep 3</option>
          </select>
        </label>
      </div>

      {!data && <p>No activity recorded for this rep.</p>}

      {data && (
        <div>
          <h3>{rep} — {data.location}</h3>
          <ul>
            <li>Knocks: {data.knocks}</li>
            <li>Talks: {data.talks}</li>
            <li>Walks: {data.walks}</li>
          </ul>
        </div>
      )}

      <p style={{ marginTop: 30 }}>
        Manager view is read-only.
      </p>
    </main>
  );
}
