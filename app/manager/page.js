"use client";

import { useEffect, useState } from "react";

export default function ManagerPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("repData"));
    if (saved) {
      setData(saved);
    }
  }, []);

  return (
    <main>
      <h1>Manager Dashboard</h1>

      {!data && <p>No activity recorded yet.</p>}

      {data && (
        <>
          <p>Latest rep activity</p>

          <div style={{ marginTop: 20 }}>
            <h3>Location: {data.location}</h3>
            <ul>
              <li>Knocks: {data.knocks}</li>
              <li>Talks: {data.talks}</li>
              <li>Walks: {data.walks}</li>
            </ul>
          </div>
        </>
      )}

      <p style={{ marginTop: 30 }}>
        Manager view is read-only.
      </p>
    </main>
  );
}
