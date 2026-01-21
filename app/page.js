"use client";

import MainNav from "../components/MainNav";

export default function HomePage() {
  return (
    <>
      <MainNav />

      {/* Home screen content (currently empty by design) */}
      <div
        style={{
          height: "100vh",
          width: "100%",
          background: "#ffffff",
        }}
      />
    </>
  );
}
