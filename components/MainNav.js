"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function MainNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [follow, setFollow] = useState(true);

  const requestGPSPermission = () => {
    if (!navigator.geolocation) {
      alert("GPS not supported on this device");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        alert("GPS permission granted");
      },
      () => {
        alert("GPS permission denied or unavailable");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <nav style={styles.nav}>
      <button
        style={styles.button(pathname === "/" )}
        onClick={() => router.push("/")}
      >
        Home
      </button>

      <button
        style={styles.button(pathname === "/map")}
        onClick={() => router.push("/map")}
      >
        Map
      </button>

      <button style={styles.button(false)} onClick={requestGPSPermission}>
        GPS
      </button>

      <button
        style={styles.button(follow)}
        onClick={() => setFollow(!follow)}
      >
        {follow ? "Follow" : "Free"}
      </button>
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    bottom: "env(safe-area-inset-bottom)",
    left: 0,
    right: 0,
    height: "64px",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderTop: "1px solid #ddd",
    zIndex: 1000,
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  button: (active) => ({
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: active ? "#111" : "#f5f5f5",
    color: active ? "#fff" : "#000",
    fontSize: "14px",
    fontWeight: 600,
  }),
};
