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
    minZoom: -2,
    maxZoom: 3,
    bounceAtZoomLimits: false, // Ngăn việc kéo bản đồ ra ngoài ranh giới ảnh
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
  map.fitBounds(nativeBounds); // Tự động kéo giãn ảnh vừa khít màn hình hiển thị

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
  // SATELLITE DATA (Cấu hình độ cao bay cố định)
  // ======================
  const satellites = [
    { name: "VINSAT-NANO-1", color: "#10b981", speed: 4, heightY: 600 },  // Bay thẳng ở trục Y = 600
    { name: "VINSAT-NANO-2", color: "#ef4444", speed: 6, heightY: 540 },  // Bay thẳng đi qua Trạm Đà Nẵng (Y = 540)
    { name: "VINSAT-NANO-3", color: "#06b6d4", speed: 3, heightY: 450 }   // Bay thẳng ở trục Y = 450
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

    const initialX = i * 600 + 100; 
    var initialPoint = new Array();
    initialPoint.push(sat.heightY);
    initialPoint.push(initialX);

    return {
      name: sat.name,
      color: sat.color,
      speed: sat.speed,
      x: initialX,
      y: sat.heightY, 
      marker: L.marker(initialPoint, { icon: icon }).addTo(map)
    };
  });

  // ======================
  // THUẬT TOÁN QUỸ ĐẠO BAY THẲNG TẮP KHÔNG ZIGZAC
  // ======================
  setInterval(function() {
    satObjects.forEach(function(sat) {
      sat.x += sat.speed; // Chỉ thay đổi trục X để dịch chuyển sang phải
      // Giữ nguyên trục Y (sat.y) để vệ tinh bay thành đường thẳng tuyệt đối

      // Reset vòng lặp tuần hoàn khi bay hết mép bên phải của bản đồ
      if (sat.x > 2000) {
        sat.x = 0;
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
