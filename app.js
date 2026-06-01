// Chờ thư viện Leaflet (L) nạp xong
const initWhenReady = setInterval(() => {
  if (typeof L !== 'undefined') {
    clearInterval(initWhenReady);
    runDashboard(); 
  }
}, 50);

function runDashboard() {
  // ======================
  // INIT MAP (Hệ tọa độ phẳng đơn giản để dùng ảnh cục bộ)
  // ======================
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: false,
    crs: L.CRS.Simple, // Bắt buộc để dùng 1 file ảnh duy nhất
    minZoom: -2,
    maxZoom: 2
  });

  // Định vị khung đồ họa chuẩn tỉ lệ ảnh 2000 x 1000
  const bounds = [[0, 0], [1000, 2000]]; 

  // ======================
  // SỬ DỤNG HÌNH ẢNH MAP.WEBP TỪ REPO CỦA BẠN
  // ======================
  const localMap = L.imageOverlay('map.webp', bounds).addTo(map);
  map.fitBounds(bounds); // Tự động căn bản đồ vừa khít khung hiển thị

  // ======================
  // TRẠM MẶT ĐẤT ĐÀ NẴNG (Tọa độ X=1600, Y=540 tương đối trên ảnh 2K)
  // ======================
  const danangCoords =; 
  
  const groundStationIcon = L.divIcon({
    className: 'gs-icon',
    html: `
      <div class="gs-pulse"></div>
      <div class="gs-dot"></div>
      <div class="gs-label">GS-1 DANANG</div>
    `,
    iconSize:,
    iconAnchor: [10, 10]
  });
  
  L.marker(danangCoords, { icon: groundStationIcon }).addTo(map);

  // ======================
  // SATELLITE DATA
  // ======================
  const satellites = [
    { name: "VINSAT-NANO-1", color: "#10b981", speed: 4 },  
    { name: "VINSAT-NANO-2", color: "#ef4444", speed: 6 }, 
    { name: "VINSAT-NANO-3", color: "#06b6d4", speed: 3 }  
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
      iconSize:,
      iconAnchor: [5, 5]
    });

    const initialX = i * 600 + 200; 

    return {
      ...sat,
      x: initialX,
      y: 540, 
      marker: L.marker([540, initialX], { icon }).addTo(map)
    };
  });

  // ======================
  // THUẬT TOÁN QUỸ ĐẠO CHẠY QUANH BẢN ĐỒ PHẲNG
  // ======================
  setInterval(() => {
    satObjects.forEach(sat => {
      sat.x += sat.speed;
      // Tạo quỹ đạo hình sin uốn lượn chạy ngang màn hình ảnh
      sat.y = 540 + (200 * Math.sin(sat.x * Math.PI / 400));

      // Reset khi bay hết mép phải của ảnh map.webp
      if (sat.x > 2000) {
        sat.x = 0;
      }

      sat.marker.setLatLng([sat.y, sat.x]);
    });
  }, 50);

  // ======================
  // TELEMETRY REAL-TIME DATA (Giữ nguyên logic cũ của bạn)
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
    if (!log) return;
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
