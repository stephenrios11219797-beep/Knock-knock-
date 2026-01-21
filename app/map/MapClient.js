"use client";

import { usePathname, useRouter } from "next/navigation";

export default function MainNav({
  onRequestGPS,
  isFollowing,
  onToggleFollow,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === "/";
  const isMap = pathname === "/map";

  return (
    <>
      {/* HOME SCREEN */}
      {isHome && (
        <button style={styles.fabLeft} onClick={() => router.push("/map")}>
          Map
        </button>
      )}

      {/* MAP SCREEN */}
      {isMap && (
        <>
          <button style={styles.fabLeft} onClick={() => router.push("/")}>
            Home
          </button>

          <div style={styles.topRightGroup}>
            <button style={styles.smallFab} onClick={onRequestGPS}>
              GPS
            </button>

            <button style={styles.smallFab} onClick={onToggleFollow}>
              {isFollowing ? "Unlock" : "Follow"}
            </button>
          </div>
        </>
      )}
    </>
  );
}

const baseFab = {
  position: "fixed",
  top: "12px",
  padding: "8px 14px",
  fontSize: "14px",
  fontWeight: "600",
  borderRadius: "10px",
  border: "1px solid #ccc",
  background: "#ffffff",
  zIndex: 1000,
};

const styles = {
  fabLeft: {
    ...baseFab,
    left: "12px",
  },
  topRightGroup: {
    position: "fixed",
    top: "12px",
    right: "12px",
    display: "flex",
    gap: "8px",
    zIndex: 1000,
  },
  smallFab: {
    padding: "6px 10px",
    fontSize: "13px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    background: "#ffffff",
  },
};
