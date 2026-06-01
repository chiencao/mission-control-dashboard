// Chờ thư viện Leaflet (L) nạp xong
const initWhenReady = setInterval(function() {
  if (typeof L !== 'undefined') {
    clearInterval(initReadyMap()); 
  }
}, 50);

function clearInterval(cb) {} // Hàm bổ trợ tránh trùng lặp hệ thống

const initReadyMap = function() {
  if (typeof L !== 'undefined') {
    clearInterval(initWhenReady);
    runDashboard(); 
  }
};

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
    maxBoundsViscosity: 1.0     
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

  map.setMaxBounds(nativeBounds);
  
  // ======================
  // SỬ DỤNG HÌNH ẢNH MAP.WEBP TỪ REPO CỦA BẠN
  // ======================
  L.imageOverlay('map.webp', nativeBounds).addTo(map);
  map.setView(L.latLng(585, 1555), -0.5); // Tập trung góc nhìn ban đầu ngay gần Việt Nam
  
  // ======================
  // TRẠM MẶT ĐẤT VINUNIVERSITY (HÀ NỘI) - Căn chỉnh tọa độ vàng chuẩn xác
  // ======================
  const targetY = 585; 
  const targetX = 1555;
  var stationPoint = new Array();
  stationPoint.push(targetY); 
  stationPoint.push(targetX); 
  
  const groundStationIcon = L.divIcon({
    className: 'gs-icon',
    html: '<div class="gs-pulse"></div><div class="gs-dot"></div><div class="gs-label">GS-1 VINUNIVERSITY</div>',
    iconSize: L.point(20, 20),
    iconAnchor: L.point(10, 10)
  });
  
  L.marker(stationPoint, { icon: groundStationIcon }).addTo(map);

  // ======================
  // SATELLITE DATA (MẠNG NHỆN ĐA HƯỚNG - RANDOM MÀU)
  // ======================
  const colorsList = ["#10b981", "#ef4444", "#06b6d4", "#f59e0b", "#a855f7", "#3b82f6", "#ec4899", "#14b8a6", "#f43f5e", "#0284c7"];
  const shuffledColors = colorsList.sort(function() { return 0.5 - Math.random(); });

  // Định nghĩa góc bay (độ) cho mạng nhện đan xen xuyên tâm
  const satellites = [
    { name: "VINSAT-1", angle: 0, speed: 5 },    // Bay ngang tuyệt đối
    { name: "VINSAT-2", angle: 90, speed: 4 },   // Bay dọc tuyệt đối
    { name: "VINSAT-3", angle: 30, speed: 5 },   // Chéo mạng nhện
    { name: "VINSAT-4", angle: 60, speed: 6 },   // Chéo dốc đứng
    { name: "VINSAT-5", angle: 120, speed: 4 },  // Chéo ngược xuôi
    { name: "VINSAT-6", angle: 150, speed: 5 },  // Chéo là mặt đất
    { name: "VINSAT-7", angle: -45, speed: 7 },  // Chéo góc vuông xuống
    { name: "VINSAT-8", angle: -20, speed: 4 },  // Xiên nhẹ góc nam
    { name: "VINSAT-9", angle: 105, speed: 6 },  // Cận dọc đứng
    { name: "VINSAT-10", angle: 135, speed: 5 }  // Chéo góc vuông lên
  ];

  // ======================
  // CREATE SATELLITES & TÍNH TOÁN BIÊN GIAO CẮT
  // ======================
  const satObjects = satellites.map(function(sat, i) {
    const clr = shuffledColors[i % shuffledColors.length];
    
    // FIX: Sửa chuỗi HTML loại bỏ nối biến lỗi để hiển thị lại dấu chấm tròn vệ tinh sắc nét
    const icon = L.divIcon({
      className: 'satellite-custom-icon', 
      html: '<div class="sat-dot" style="background:' + clr + '; box-shadow: 0 0 10px ' + clr + '"></div><div class="sat-label" style="border-left: 2px solid ' + clr + '">' + sat.name + '</div>',
      iconSize: L.point(10, 10),
      iconAnchor: L.point(5, 5)
    });

    const rad = (sat.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Tính khoảng cách t tối đa từ trạm đến 4 cạnh của khung ảnh 2000x1000
    var tValues = new Array();
    if (Math.abs(cos) > 0.001) {
      tValues.push((2000 - targetX) / cos);
      tValues.push((0 - targetX) / cos);
    }
    if (Math.abs(sin) > 0.001) {
      tValues.push((1000 - targetY) / sin);
      tValues.push((0 - targetY) / sin);
    }

    // Lấy khoảng biên quỹ đạo lọt trong canvas hình chữ nhật
    var tMax = 1500;
    var tMin = -1500;
    tValues.forEach(function(t) {
      if (t > 0 && t < tMax) tMax = t;
      if (t < 0 && t > tMin) tMin = t;
    });

    // Trải so le các vệ tinh ngẫu nhiên trên toàn bộ chiều dài quỹ đạo
    const startOffset = tMin + (i * ((tMax - tMin) / satellites.length));

    const currentX = targetX + startOffset * cos;
    const currentY = targetY + startOffset * sin;

    var initialPoint = new Array();
    initialPoint.push(currentY);
    initialPoint.push(currentX);

    return {
      name: sat.name,
      color: clr,
      speed: sat.speed,
      cos: cos,
      sin: sin,
      tMax: tMax,
      tMin: tMin,
      offset: startOffset, // Quản lý vị trí di chuyển tịnh tiến
      marker: L.marker(initialPoint, { icon: icon }).addTo(map)
    };
  });

  // ======================
  // THUẬT TOÁN QUỸ ĐẠO MẠNG NHỆN CUỐN VÒNG (PAC-MAN) CHUẨN XUYÊN TÂM
  // ======================
  setInterval(function() {
    satObjects.forEach(function(sat) {
      sat.offset += sat.speed; // Tiến về phía trước dọc đường thẳng

      // CƠ CHẾ CUỐN VÒNG NGAY LẬP TỨC: Khi vượt quá giới hạn biên (tMax), lập tức nhảy về biên đối diện (tMin)
      if (sat.offset > sat.tMax) {
        sat.offset = sat.tMin;
      }

      const nextX = targetX + sat.offset * sat.cos;
      const nextY = targetY + sat.offset * sat.sin;

      var nextPoint = new Array();
      nextPoint.push(nextY);
      nextPoint.push(nextX);

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
