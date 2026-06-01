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
  map.setView(L.latLng(500, 1000), -0.5); 
  
  // ======================
  // TRẠM MẶT ĐẤT ĐÀ NẴNG (Tâm điểm bắt buộc cắt qua)
  // ======================
  const targetY = 540; 
  const targetX = 1600;
  var stationPoint = new Array();
  stationPoint.push(targetY); 
  stationPoint.push(targetX); 
  
  const groundStationIcon = L.divIcon({
    className: 'gs-icon',
    html: '<div class="gs-pulse"></div><div class="gs-dot"></div><div class="gs-label">GS-1 DANANG</div>',
    iconSize: L.point(20, 20),
    iconAnchor: L.point(10, 10)
  });
  
  L.marker(stationPoint, { icon: groundStationIcon }).addTo(map);

  // ======================
  // SATELLITE DATA (ĐA HƯỚNG QUỸ ĐẠO: NGANG, DỌC, CHÉO MẠNG NHỆN)
  // ======================
  const colorsList = ["#10b981", "#ef4444", "#06b6d4", "#f59e0b", "#a855f7", "#3b82f6", "#ec4899", "#14b8a6", "#f43f5e", "#0284c7"];
  const shuffledColors = colorsList.sort(function() { return 0.5 - Math.random(); });

  // Cấu hình góc bay (độ) riêng biệt cho từng vệ tinh để tạo hiệu ứng đan lưới mạng nhện
  const satellites = [
    { name: "VINSAT-NANO-1", color: shuffledColors[0], speed: 4, angle: 0 },    // Bay ngang tuyệt đối (0 độ)
    { name: "VINSAT-NANO-2", color: shuffledColors[1], speed: 5, angle: 90 },   // Bay dọc tuyệt đối (90 độ)
    { name: "VINSAT-NANO-3", color: shuffledColors[2], speed: 3, angle: 30 },   // Bay chéo xiên nhẹ
    { name: "VINSAT-NANO-4", color: shuffledColors[3], speed: 6, angle: 150 },  // Bay chéo hướng ngược lại
    { name: "VINSAT-NANO-5", color: shuffledColors[4], speed: 4, angle: 45 },   // Bay chéo góc vuông cân
    { name: "VINSAT-NANO-6", color: shuffledColors[5], speed: 5, angle: 125 },  // Bay chéo dốc đứng
    { name: "VINSAT-NANO-7", color: shuffledColors[6], speed: 3, angle: 75 },   // Bay dọc lệch nhẹ
    { name: "VINSAT-NANO-8", color: shuffledColors[7], speed: 6, angle: -45 },  // Bay chéo từ góc trái trên xuống phải dưới
    { name: "VINSAT-NANO-9", color: shuffledColors[8], speed: 2, angle: 10 },   // Bay ngang lệch xiên nhẹ
    { name: "VINSAT-NANO-10", color: shuffledColors[9], speed: 7, angle: 105 }  // Bay dọc lệch xiên đậm
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

    // Biến offset điều khiển khoảng cách tiến lùi trên quỹ đạo. 
    // Rải so le giá trị ban đầu từ -800 đến 800 để các vệ tinh rải rác khắp nơi, không tụ lại ở Trạm cùng một lúc
    const initialOffset = (i * 200) - 900; 

    // Chuyển đổi góc độ sang Radian để tính toán lượng giác
    const rad = (sat.angle * Math.PI) / 180;

    // Tính toán vị trí xuất phát chạy xuyên qua Tâm Đà Nẵng
    const currentX = targetX + initialOffset * Math.cos(rad);
    const currentY = targetY + initialOffset * Math.sin(rad);

    var initialPoint = new Array();
    initialPoint.push(currentY);
    initialPoint.push(currentX);

    return {
      name: sat.name,
      color: sat.color,
      speed: sat.speed,
      angle: sat.angle,
      offset: initialOffset, // Quản lý vị trí di chuyển dọc theo vector góc
      marker: L.marker(initialPoint, { icon: icon }).addTo(map)
    };
  });

  // ======================
  // THUẬT TOÁN QUỸ ĐẠO MẠNG NHỆN CẮT QUA TRẠM ĐÀ NẴNG
  // ======================
  setInterval(function() {
    satObjects.forEach(function(sat) {
      // Tăng chỉ số offset để vệ tinh bay tiến về phía trước theo hướng góc của nó
      sat.offset += sat.speed; 

      const rad = (sat.angle * Math.PI) / 180;
      let nextX = targetX + sat.offset * Math.cos(rad);
      let nextY = targetY + sat.offset * Math.sin(rad);

      // Thuật toán kiểm tra ranh giới: Nếu bay ra khỏi phạm vi bản đồ 2000x1000 thì reset vòng lặp tuần hoàn
      if (nextX < -200 || nextX > 2200 || nextY < -200 || nextY > 1200) {
        // Đưa vệ tinh quay trở lại đầu bên kia của quỹ đạo xuyên trạm (bên ngoài màn hình đối diện)
        sat.offset = -1200; 
        nextX = targetX + sat.offset * Math.cos(rad);
        nextY = targetY + sat.offset * Math.sin(rad);
      }

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
