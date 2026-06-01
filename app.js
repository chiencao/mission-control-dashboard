// Chờ thư viện Leaflet (L) nạp xong
const initWhenReady = setInterval(() => {
  if (typeof L !== 'undefined') {
    clearInterval(initWhenReady);
    runDashboard(); 
  }
}, 50);

function runDashboard() {
  // ======================
  // INIT MAP
  // ======================
  // ĐÃ SỬA: Điền tọa độ khởi tạo hợp lệ [15, 0] tránh lỗi biên bản đồ
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([15, 0], 2);

  // ĐÃ SỬA: URL chuẩn xác để kéo bản đồ nền tối (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  // Ép Leaflet tính toán lại kích thước khung chứa ngay khi render xong
  setTimeout(() => {
    map.invalidateSize();
  }, 200);

  // ======================
  // SATELLITE DATA
  // ======================
  const satellites = [
    { name: "VINSAT-NANO-1", color: "#10b981", speed: 1.2 }, 
    { name: "VINSAT-NANO-2", color: "#ef4444", speed: 1.5 }, 
    { name: "VINSAT-NANO-3", color: "#06b6d4", speed: 1.0 }  
  ];

  // ======================
  // CREATE SATELLITES
  // ======================
  const satObjects = satellites.map((sat, i) => {
    const icon = L.divIcon({
      className: 'satellite-custom-icon', 
      html: `
        <div class="sat-dot" style="background:${sat.color}; box-shadow: 0 0 8px ${sat.color}, 0 0 16px ${sat.color}"></div>
        <div class="sat-label" style="border-left: 2px solid ${sat.color}">${sat.name}</div>
      `,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });

    const initialLng = i * 120 - 180; 

    return {
      ...sat,
      lat: 0,
      lng: initialLng,
      marker: L.marker([0, initialLng], { icon }).addTo(map)
    };
  });

  // ======================
  // ORBIT SIMULATION
  // ======================
  setInterval(() => {
    satObjects.forEach(sat => {
      sat.lng += sat.speed;
      sat.lat = 45 * Math.sin(sat.lng * Math.PI / 180);

      if (sat.lng > 180) {
        sat.lng = -180;
      }

      sat.marker.setLatLng([sat.lat, sat.lng]);
    });
  }, 100);

  // ======================
  // TELEMETRY REAL-TIME DATA
  // ======================
  function random(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
  }

  function updateTelemetry() {
    const speed = random(120, 180);
    const fuel = random(40, 90);
    const signal = random(70, 100);

    const speedEl = document.querySelector(".speed");
    if (speedEl) speedEl.innerText = `${speed} Mbps`;

    const randomSat = satObjects[Math.floor(Math.random() * satObjects.length)];
    const log = document.querySelector(".log");
    const time = new Date().toLocaleTimeString();

    const msg = `[${time}] [${randomSat.name}] Downlink: ${speed} Mbps | Nhiên liệu: ${fuel}% | Tín hiệu: ${signal}%`;
    const div = document.createElement("div");
    div.className = "log-item";
    div.innerText = msg;

    if (signal < 75) {
      div.style.color = "#ef4444"; 
    } else if (speed > 160) {
      div.style.color = "#10b981"; 
    } else {
      div.style.color = "#3b82f6"; 
    }

    log.prepend(div);

    if (log.children.length > 20) {
      log.removeChild(log.lastChild);
    }
  }

  setInterval(updateTelemetry, 1500);
}
