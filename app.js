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
  // TRẠM MẶT ĐẤT VINUNIVERSITY (HÀ NỘI) - Tọa độ mới vào sâu đất liền phía Bắc
  // ======================
  const targetY = 620; 
  const targetX = 1580;
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
  // SATELLITE DATA (ĐA HƯỚNG QUỸ ĐẠO HỘI TỤ TẠI VINUNI)
  // ======================
  const colorsList = ["#10b981", "#ef4444", "#06b6d4", "#f59e0b", "#a855f7", "#3b82f6", "#ec4899", "#14b8a6", "#f43f5e", "#0284c7"];
  const shuffledColors = colorsList.sort(function() { return 0.5 - Math.random(); });

  // Định nghĩa độ dốc (Hệ số góc m) cho quỹ đạo đi qua trạm VinUni: (y - targetY) = m * (x - targetX)
  // Với các vệ tinh dọc hẳn hoặc ngang hẳn, ta xử lý góc di chuyển riêng
  const satellites = [
    { name: "VINSAT-NANO-1", color: shuffledColors, speed: 4, angle: 0 },    // Bay ngang chuẩn qua Hà Nội
    { name: "VINSAT-NANO-2", color: shuffledColors, speed: 5, angle: 90 },   // Bay dọc đứng chuẩn qua Hà Nội
    { name: "VINSAT-NANO-3", color: shuffledColors, speed: 3, angle: 15 },   // Xiên xiết nhẹ
    { name: "VINSAT-NANO-4", color: shuffledColors, speed: 6, angle: -15 },  // Xiên hướng ngược lại
    { name: "VINSAT-NANO-5", color: shuffledColors, speed: 4, angle: 30 },   // Xiên vừa chéo lên
    { name: "VINSAT-NANO-6", color: shuffledColors, speed: 5, angle: -30 },  // Xiên vừa chéo xuống
    { name: "VINSAT-NANO-7", color: shuffledColors, speed: 3, angle: 45 },   // Chéo góc 45 độ sắc nét
    { name: "VINSAT-NANO-8", color: shuffledColors, speed: 5, angle: -45 },  // Chéo góc -45 độ sắc nét
    { name: "VINSAT-NANO-9", color: shuffledColors, speed: 3, angle: 60 },   // Dốc đứng hơn
    { name: "VINSAT-NANO-10", color: shuffledColors, speed: 6, angle: -60 }  // Dốc ngược xuống
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

    // Rải đều tọa độ kinh độ X ban đầu trên bản đồ phẳng (từ 0 đến 2000)
    let initialX = (i * 200) % 2000;
    let initialY = targetY;

    // Tính toán trục dọc Y dựa trên trục ngang X để đảm bảo chúng xuất hiện nằm ngay trên đường thẳng đi qua trạm
    if (sat.angle !== 90) {
      const rad = (sat.angle * Math.PI) / 180;
      const slope = Math.tan(rad);
      initialY = targetY + (initialX - targetX) * slope;
      
      // Nếu tọa độ Y khởi tạo vượt quá biên màn hình, ta đẩy lùi X để khớp khung hình 1000x2000
      if (initialY < 0 || initialY > 1000) {
         initialX = targetX;
         initialY = targetY;
      }
    } else {
      // Đối với vệ tinh bay dọc 90 độ, X cố định bằng Kinh độ trạm, Y rải đều từ 0 đến 1000
      initialX = targetX;
      initialY = (i * 100) % 1000;
    }

    var initialPoint = new Array();
    initialPoint.push(initialY);
    initialPoint.push(initialX);

    return {
      name: sat.name,
      color: sat.color,
      speed: sat.speed,
      angle: sat.angle,
      x: initialX,
      y: initialY,
      marker: L.marker(initialPoint, { icon: icon }).addTo(map)
    };
  });

  // ======================
  // THUẬT TOÁN CUỐN VÒNG QUỸ ĐẠO KHÔNG GIAN (PAC-MAN WRAPPING)
  // ======================
  setInterval(function() {
    satObjects.forEach(function(sat) {
      const rad = (sat.angle * Math.PI) / 180;

      if (sat.angle === 90) {
        // Xử lý chuyển động cho vệ tinh dọc đứng: Tịnh tiến trục Y đi xuống
        sat.y -= sat.speed;
        // Chạm đáy bản đồ dưới (Y < 0) -> Nhảy vọt lên đỉnh bản đồ trên (Y = 1000) ngay lập tức
        if (sat.y < 0) {
          sat.y = 1000;
        }
      } else {
        // Xử lý chuyển động cho vệ tinh ngang/chéo: Tịnh tiến liên tục trục X sang bên phải
        sat.x += sat.speed;
        
        // Chạm biên phải bản đồ thế giới (X > 2000) -> Xuất hiện ngay lập tức bên rìa trái (X = 0)
        if (sat.x > 2000) {
          sat.x = 0;
        }
        
        // Cập nhật trục Y trượt tịnh tiến theo đúng góc nghiêng quỹ đạo đi qua tâm trạm VinUni
        const slope = Math.tan(rad);
        sat.y = targetY + (sat.x - targetX) * slope;

        // Nếu góc chéo quá dốc làm vệ tinh trượt lọt ra ngoài mép trên hoặc mép dưới của bản đồ phẳng Trái Đất
        if (sat.y > 1000) {
          sat.y = sat.y - 1000; // Cuốn vòng trục dọc lên trên
        } else if (sat.y < 0) {
          sat.y = sat.y + 1000; // Cuốn vòng trục dọc xuống dưới
        }
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
