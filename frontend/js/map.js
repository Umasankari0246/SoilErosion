/**
 * Leaflet.js Interactive Soil Map Module
 */
let map = null;
let markersGroup = null;
let allMapSamples = [];

document.addEventListener('DOMContentLoaded', async () => {
  initLeafletMap();

  // Fetch all soil samples for public map view
  const res = await Auth.apiCall('/soil?public_map=true');
  if (!res.success) return;

  allMapSamples = res.samples || [];
  renderMapMarkers(allMapSamples);
});

function initLeafletMap() {
  // Default center over India coordinates (approx lat 20.5937, long 78.9629)
  map = L.map('map').setView([19.5, 75.5], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);
}

function renderMapMarkers(samples) {
  markersGroup.clearLayers();

  if (samples.length === 0) return;

  const bounds = L.latLngBounds();

  samples.forEach(s => {
    const lat = parseFloat(s.latitude);
    const lng = parseFloat(s.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    let markerColor = '#2e7d32'; // Healthy Green
    if (s.condition.includes('Severe')) markerColor = '#d32f2f'; // Red
    else if (s.condition.includes('High')) markerColor = '#f57c00'; // Orange
    else if (s.condition.includes('Moderate')) markerColor = '#fbc02d'; // Yellow
    else if (s.condition.includes('Low')) markerColor = '#8bc34a'; // Lime

    // Create custom SVG circular pin icon
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupHtml = `
      <div style="min-width: 200px;">
        <h6 class="fw-bold mb-1 text-success">#SMP-${s.id} - ${s.village}</h6>
        <div class="small text-muted mb-2"><i class="fas fa-map-marker-alt me-1"></i>${s.district}, ${s.state}</div>
        <div class="mb-1"><strong>Soil Type:</strong> ${s.soil_type}</div>
        <div class="mb-1"><strong>Degradation Score:</strong> ${s.degradation_score} / 100</div>
        <div class="mb-2"><strong>Status:</strong> <span class="badge" style="background-color: ${markerColor}; color: #fff;">${s.condition}</span></div>
        <div class="small text-muted mb-2">Analysis Date: ${new Date(s.analysis_date).toLocaleDateString()}</div>
        <a href="analysis-result.html?id=${s.id}" class="btn btn-sm btn-success w-100 text-white"><i class="fas fa-eye me-1"></i>View Full Report</a>
      </div>
    `;

    const marker = L.marker([lat, lng], { icon: customIcon }).bindPopup(popupHtml);
    markersGroup.addLayer(marker);
    bounds.extend([lat, lng]);
  });

  if (samples.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

function filterMapByCondition(level) {
  const btnGroup = document.querySelectorAll('.map-filter-btn');
  btnGroup.forEach(b => b.classList.remove('active', 'btn-success'));

  if (!level) {
    document.getElementById('btn-filter-all').classList.add('active', 'btn-success');
    renderMapMarkers(allMapSamples);
    return;
  }

  const filtered = allMapSamples.filter(s => s.condition.toLowerCase().includes(level.toLowerCase()));
  renderMapMarkers(filtered);
}
