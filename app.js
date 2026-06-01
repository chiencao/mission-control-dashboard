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
  // Đã sửa: Đặt tâm bản đồ ngay tại khu vực Đông Nam Á để nhìn rõ Việt Nam
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([16.0, 108.0], 3);

     // ======================
  // INIT MAP
  // ======================
  // Đã sửa: Đặt tâm bản đồ ngay tại khu vực Đông Nam Á để nhìn rõ Việt Nam
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([16.0, 108.0], 3);

  // THAY THẾ CHÍNH XÁC ĐOẠN NÀY ĐỂ HẾT LỖI ERR_NAME_NOT_RESOLVED:
  L.tileLayer('https://{s}://{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);


  // ĐÃ SỬA: Ép bản đồ tự động vẽ lại sau 100ms, 500ms và 1000ms để chống lỗi sập giao diện
  setTimeout(() => { map.invalidateSize(); }, 100);
  setTimeout(() => { map.invalidateSize(); }, 500);
  setTimeout(() => { map.invalidateSize(); }, 1000);


  // Ép Leaflet tính toán lại kích thước khung chứa
  setTimeout(() => {
    map.invalidateSize();
  }, 200);

  // ======================
  // ĐÃ THÊM: TRẠM MẶT ĐẤT ĐÀ NẴNG
  // ======================
  const danangCoords = [16.047, 108.206]; // Tọa độ thực tế Đà Nẵng
  
  const groundStationIcon = L.divIcon({
    className: 'gs-icon',
    html: `
      <div class="gs-pulse"></div>
      <div class="gs-dot"></div>
      <div class="gs-label">GS-1 DANANG</div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  
  L.marker(danangCoords, { icon: groundStationIcon }).addTo(map);

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

    // Phát tán vị trí ban đầu lệch nhau trên quỹ đạo vòng quanh Trái Đất
    const initialLng = i * 120 - 180; 

    return {
      ...sat,
      lat: 16.0, // Bắt đầu ở vĩ độ Đà Nẵng
      lng: initialLng,
      marker: L.marker([16.0, initialLng], { icon }).addTo(map)
    };
  });

  // ======================
  // THUẬT TOÁN QUỸ ĐẠO QUÉT QUA VIỆT NAM (ĐÃ SỬA)
  // ======================
  setInterval(() => {
    satObjects.forEach(sat => {
      sat.lng += sat.speed;
      
      /* 
        TỐI ƯU QUỸ ĐẠO: 
        - Lấy vĩ độ 16.5 làm trục tâm (độ cao của Việt Nam).
        - Biên độ hình sin thu hẹp còn 12 độ để vệ tinh dao động liên tục 
          trong khoảng từ vĩ độ 4.5 (Nam Bộ) đến vĩ độ 28.5 (Bắc Bộ).
        - Khi kinh độ (lng) quét qua vùng 102 đến 110, vệ tinh CHẮC CHẮN cắt thẳng qua Việt Nam.
      */
      sat.lat = 16.5 + (12 * Math.sin(sat.lng * Math.PI / 90));

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
