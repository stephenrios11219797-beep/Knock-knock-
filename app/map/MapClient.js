function requestGPS() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: 17,
        essential: true,
      });

      setUserLocation([longitude, latitude]);
      setIsFollowing(true);
    },
    (error) => {
      alert("GPS permission denied or unavailable");
      console.error(error);
    },
    {
      enableHighAccuracy: true,
    }
  );
}
