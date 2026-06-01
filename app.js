// init map toàn cầu
const map = L.map('map', {
  zoomControl: false
}).setView([20, 0], 2); // center world

// dark map (giống HUD hơn)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: ''
}).addTo(map);

// fake satellite marker
const satIcon = L.divIcon({
  className: 'satellite-icon'
});

let lat = 0;
let lng = 0;

// create marker
const sat = L.marker([lat, lng], { icon: satIcon }).addTo(map);

// simulate orbit (simple)
setInterval(() => {
  lng += 1.5;     // move quanh trái đất
  lat = 20 * Math.sin(lng * Math.PI / 180); // dao động như quỹ đạo

  if (lng > 180) lng = -180;

  sat.setLatLng([lat, lng]);

}, 100);
