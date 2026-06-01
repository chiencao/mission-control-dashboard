// Chờ thư viện Leaflet (L) nạp xong
const initWhenReady = setInterval(function() {
  if (typeof L !== 'undefined') {
    clearInterval(initWhenReady);
    runDashboard(); 
  }
}, 50);

function runDashboard() {
  // ======================
  // INIT MAP (Bung hết cỡ bản đồ và vô hiệu hóa khoảng trống thừa)
  // ======================
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: false,
    crs: L.CRS.Simple,
    zoomSnap: 0.1,  
    minZoom: -2,
    maxZoom: 3,
    maxBoundsViscosity: 1.0     // Khóa chặt góc nhìn, không cho kéo lệch khỏi ảnh nền
  });

  // Thiết lập ma trận ranh giới bản đồ (2000 x 1000)
  var pointBottomLeft = new Array();
  pointBottomLeft.push(0);
  pointBottomLeft.push(0);

  var pointTopRight = new Array();
  pointTopRight.push(1000);
  pointTopRight.push(2000);

  var nativeBounds = new Array();
  nativeBounds.push(pointBottomLeft);
  nativeBounds.push(pointTopRight);

  // Ép bản đồ giới hạn nghiêm ngặt trong khung ảnh này để tránh viền xám đen bên ngoài
  map.setMaxBounds(nativeBounds);
  
  // ======================
  // SỬ DỤNG HÌNH ẢNH MAP.WEBP TỪ REPO CỦA BẠN
  // ======================
  L.imageOverlay('map.webp', nativeBounds).addTo(map);
  map.setView(L.latLng(500, 1000), -0.5); 
  
  // ======================
  // TRẠM MẶT ĐẤT ĐÀ NẴNG
  // ======================
  var stationPoint = new Array();
  stationPoint.push(540); // Tọa độ trục Y (Vĩ độ phẳng)
  stationPoint.push(1600); // Tọa độ trục X (Kinh độ phẳng)
  
  const groundStationIcon = L.divIcon({
    className: 'gs-icon',
    html: '<div class="gs-pulse"></div><div class="gs-dot"></div><div class="gs-label">GS-1 DANANG</div>',
    iconSize: L.point(20, 20),
    iconAnchor: L.point(10, 10)
  });
  
  L.marker(stationPoint, { icon: groundStationIcon }).addTo(map);

  // ======================
  // SATELLITE DATA (ĐÃ RANDOM MÀU & CONFIG BAY THẲNG TỪ TRÊN XUỐNG)
  // ======================
  const colorsList = ["#10b981", "#ef4444", "#06b6d4", "#f59e0b", "#a855f7", "#3b82f6", "#ec4899", "#14b8a6", "#f43f5e", "#0284c7"];
  
  // Thuật toán trộn ngẫu nhiên bảng màu khi tải trang
  const shuffledColors = colorsList.sort(function() { return 0.5 - Math.random(); });

  const satellites = [
    { name: "VINSAT-NANO-1", color: shuffledColors[0], speed: 4, fixedX: 200 },  
    { name: "VINSAT-NANO-2", color: shuffledColors[1], speed: 6, fixedX: 400 },  
    { name: "VINSAT-NANO-3", color: shuffledColors[2], speed: 3, fixedX: 600 },   
    { name: "VINSAT-NANO-4", color: shuffledColors[3], speed: 6, fixedX: 800 },  
    { name: "VINSAT-NANO-5", color: shuffledColors[4], speed: 7, fixedX: 1000 },  
    { name: "VINSAT-NANO-6", color: shuffledColors[5], speed: 4, fixedX: 1200 },  
    { name: "VINSAT-NANO-7", color: shuffledColors[6], speed: 3, fixedX: 1400 },  
    { name: "VINSAT-NANO-8", color: shuffledColors[7], speed: 5, fixedX: 1600 },  // Đường bay cắt thẳng qua Trạm Đà Nẵng (X = 1600)
    { name: "VINSAT-NANO-9", color: shuffledColors[8], speed: 2, fixedX: 1750 },  
    { name: "VINSAT-NANO-10", color: shuffledColors[9], speed: 9, fixedX: 1900 }  
  ];

  // ======================
  // CREATE SATELLITES
  // ======================
  const satObjects = satellites.map(function(sat, i) {
    const icon = L.divIcon({
      className: 'satellite-custom-icon', 
      html: '<div class="sat-dot" style="background:' + sat.color + '; box-shadow: 0 0 8px ' + sat.color + ', 0 0 16px ' + sat.color + '"></div><div class="sat-label" style="border-left: 2px solid ' + sat.color + '">' + sat.name + '</div>',
      iconSize: L.point(10, 10),
      iconAnchor: L.point(5, 5)
    });

    // Rải so le vị trí Y ban đầu (từ 300 đến 1000) để lúc mở web không bị xếp hàng ngang
    const initialY = 1000 - (i * 70) % 700; 
    var initialPoint = new Array();
    initialPoint.push(initialY);
    initialPoint.push(sat.fixedX);

    return {
      name: sat.name,
      color: sat.color,
      speed: sat.speed,
      x: sat.fixedX,
      y: initialY, 
      marker: L.marker(initialPoint, { icon: icon }).addTo(map)
    };
  });

  // ======================
  // THUẬT TOÁN QUỸ ĐẠO BAY THẲNG TỪ TRÊN XUỐNG DƯỚI
  // ======================
  setInterval(function() {
    satObjects.forEach(function(sat) {
      sat.y -= sat.speed; // Giảm trục Y để vệ tinh tịnh tiến bay từ trên đỉnh xuống đáy bản đồ

      // Reset vòng lặp: Khi bay xuống quá mép dưới cùng (Y < 0), đưa vệ tinh trở lại đỉnh trên cùng (Y = 1000)
      if (sat.y < 0) {
        sat.y = 1000;
      }

      var nextPoint = new Array();
      nextPoint.push(sat.y);
      nextPoint.push(sat.x);

      sat.marker.setLatLng(nextPoint);
    });
  }, 50);

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
    if (speedEl) speedEl.innerText = speed + " Mbps";

    const randomSat = satObjects[Math.floor(Math.random() * satObjects.length)];
    const log = document.querySelector(".log");
    if (!log) return;
    const time = new Date().toLocaleTimeString();

    const msg = "[" + time + "] [" + randomSat.name + "] Downlink: " + speed + " Mbps | Nhiên liệu: " + fuel + "% | Tín hiệu: " + signal + "%";
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
