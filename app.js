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
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([15, 0], 2);

  // ĐÃ SỬA: Thay đổi URL chuẩn xác để kéo bản đồ nền xám tối (CartoDB Dark Matter)
  L.tileLayer('https://{s}://{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

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
    // Tạo custom icon bằng DivIcon
    const icon = L.divIcon({
      className: 'satellite-custom-icon', // Sử dụng đúng class riêng biệt để áp CSS
      html: `
        <div class="sat-dot" style="background:${sat.color}; box-shadow: 0 0 8px ${sat.color}, 0 0 16px ${sat.color}"></div>
        <div class="sat-label" style="border-left: 2px solid ${sat.color}">${sat.name}</div>
      `,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });

    // Phát tán vị trí ban đầu cho các vệ tinh lệch nhau ra không bị chồng lên nhau
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
      // Tạo quỹ đạo hình sin giả lập bay vòng quanh Trái Đất
      sat.lat = 45 * Math.sin(sat.lng * Math.PI / 180);

      // Reset kinh độ nếu vượt quá 180 độ (Vòng lại bản đồ)
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

    // Cập nhật số Mbps trực tiếp lên màn hình panel trái
    const speedEl = document.querySelector(".speed");
    if (speedEl) speedEl.innerText = `${speed} Mbps`;

    // Sinh log real-time ngẫu nhiên theo tên từng vệ tinh đang chạy
    const randomSat = satObjects[Math.floor(Math.random() * satObjects.length)];
    const log = document.querySelector(".log");
    const time = new Date().toLocaleTimeString();

    const msg = `[${time}] [${randomSat.name}] Downlink: ${speed} Mbps | Nhiên liệu: ${fuel}% | Tín hiệu: ${signal}%`;
    const div = document.createElement("div");
    div.className = "log-item";
    div.innerText = msg;

    // Đổi màu chữ theo trạng thái của telemetry để theo dõi trực quan
    if (signal < 75) {
      div.style.color = "#ef4444"; // Đỏ khi tín hiệu sụt giảm
    } else if (speed > 160) {
      div.style.color = "#10b981"; // Xanh lá khi downlink siêu nhanh
    } else {
      div.style.color = "#3b82f6"; // Xanh dương trạng thái ổn định
    }

    log.prepend(div);

    // Giữ log tối đa 20 dòng để tránh đầy bộ nhớ trình duyệt
    if (log.children.length > 20) {
      log.removeChild(log.lastChild);
    }
  }

  // Kích hoạt cập nhật dữ liệu telemetry liên tục mỗi 1.5 giây
  setInterval(updateTelemetry, 1500);
}
