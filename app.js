// ======================
// INIT MAP
// ======================
const map = L.map('map', {
  zoomControl: false
}).setView([20, 0], 2);

L.tileLayer('https://{s}://{z}/{x}/{y}{r}.png').addTo(map);

// ======================
// SATELLITE DATA (ĐÃ CẬP NHẬT MÀU SẮC RÕ RÀNG)
// ======================
const satellites = [
  { name: "VINSAT-NANO-1", color: "#10b981", speed: 1.2 }, // Xanh lá tươi
  { name: "VINSAT-NANO-2", color: "#ef4444", speed: 1.5 }, // Đỏ rực
  { name: "VINSAT-NANO-3", color: "#06b6d4", speed: 1.0 }  // Xanh lục bảo
];

// ======================
// CREATE SATELLITES
// ======================
const satObjects = satellites.map((sat, i) => {

  // Thêm style="color: ${sat.color}" để đồng bộ hiệu ứng phát sáng box-shadow
  const icon = L.divIcon({
    className: 'satellite-icon',
    html: `
      <div class="sat-dot" style="background:${sat.color}; color:${sat.color}"></div>
      <div class="sat-label" style="border-left: 2px solid ${sat.color}">${sat.name}</div>
    `,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  return {
    ...sat,
    lat: 0,
    lng: i * 60,
    marker: L.marker([0, i * 60], { icon }).addTo(map)
  };
});

// ======================
// ORBIT SIMULATION
// ======================
setInterval(() => {
  satObjects.forEach(sat => {
    sat.lng += sat.speed;
    sat.lat = 20 * Math.sin(sat.lng * Math.PI / 180);

    if (sat.lng > 180) sat.lng = -180;

    sat.marker.setLatLng([sat.lat, sat.lng]);
  });
}, 100);

// ======================
// TELEMETRY RANDOM DATA
// ======================
function random(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function updateTelemetry() {
  const speed = random(120, 180);
  const fuel = random(40, 90);
  const signal = random(70, 100);

  document.querySelector(".speed").innerText = `${speed} Mbps`;

  const log = document.querySelector(".log");
  const time = new Date().toLocaleTimeString();

  // Đổi cấu trúc log thành class .log-item
  const msg = `[${time}] [TELEMETRY] Downlink: ${speed} Mbps | Fuel: ${fuel}% | Signal: ${signal}%`;
  const div = document.createElement("div");
  div.className = "log-item";
  div.innerText = msg;

  // Tô màu ngẫu nhiên cho dòng chữ log nhìn trực quan giống hệ thống thật
  if (signal < 75) {
    div.style.color = "#ef4444"; // Cảnh báo đỏ nếu tín hiệu yếu
  } else if (speed > 160) {
    div.style.color = "#10b981"; // Màu xanh lá khi đạt tốc độ cao
  } else {
    div.style.color = "#3b82f6"; // Màu xanh dương mặc định
  }

  log.prepend(div);

  if (log.children.length > 20) {
    log.removeChild(log.lastChild);
  }
}

setInterval(updateTelemetry, 2000);
