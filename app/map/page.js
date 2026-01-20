import MapClient from "./MapClient";
import MainNav from "../../components/MainNav";

export default function MapPage() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MainNav />
      <MapClient />
    </div>
  );
}
