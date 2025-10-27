import L from "leaflet";

class MapHandler {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.markers = [];
    this.defaultCenter = [-2.5489, 118.0149]; // Indonesia
    this.defaultZoom = 5;
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(this.containerId).setView(
      this.defaultCenter,
      this.defaultZoom
    );

    // Tile Layers
    const osmLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }
    );

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "© Esri",
        maxZoom: 19,
      }
    );

    const topoLayer = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenTopoMap contributors",
        maxZoom: 17,
      }
    );

    osmLayer.addTo(this.map);

    // Layer Control
    const baseMaps = {
      "Street Map": osmLayer,
      Satellite: satelliteLayer,
      Topographic: topoLayer,
    };

    L.control.layers(baseMaps).addTo(this.map);

    return this.map;
  }

  addMarker(lat, lon, content, storyId) {
    if (!this.map) return;

    const marker = L.marker([lat, lon]).addTo(this.map).bindPopup(content);

    marker.storyId = storyId;
    this.markers.push(marker);

    return marker;
  }

  clearMarkers() {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
  }

  fitBounds() {
    if (!this.map || this.markers.length === 0) return;

    const group = L.featureGroup(this.markers);
    this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
  }

  highlightMarker(storyId) {
    this.markers.forEach((marker) => {
      if (marker.storyId === storyId) {
        marker.openPopup();
        this.map.panTo(marker.getLatLng());
      }
    });
  }

  onClick(callback) {
    if (!this.map) return;
    this.map.on("click", callback);
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

export default MapHandler;
