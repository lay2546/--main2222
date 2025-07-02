import { db } from './firebase.js';
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 📊 อ้างอิง Element
const totalSalesEl = document.getElementById("total-sales");
const totalOrdersEl = document.getElementById("total-orders");
const salesChartEl = document.getElementById("salesChart");

async function loadDashboardData() {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt"));
    const snapshot = await getDocs(q);

    let totalSales = 0;
    let totalOrders = 0;
    const salesByDate = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      const dateKey = createdAt?.toISOString().split("T")[0];

      if (Array.isArray(data.cart)) {
        data.cart.forEach((item) => {
          totalSales += (item.price || 0) * (item.quantity || 1);
        });
      }

      totalOrders += 1;
      if (dateKey) {
        salesByDate[dateKey] = (salesByDate[dateKey] || 0) + 1;
      }
    });

    // 💰 แสดงยอดขายรวม
    totalSalesEl.textContent = `฿${totalSales.toLocaleString()}`;

    // 📦 แสดงจำนวนคำสั่งซื้อ
    totalOrdersEl.textContent = `${totalOrders} รายการ`;

    // 📅 วาดกราฟ Chart.js
    renderSalesChart(salesByDate);
  } catch (error) {
    console.error("❌ โหลดข้อมูล Dashboard ล้มเหลว:", error);
  }
}

function renderSalesChart(salesData) {
  const labels = Object.keys(salesData).sort();
  const values = labels.map(date => salesData[date]);

  new Chart(salesChartEl, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'จำนวนคำสั่งซื้อ',
        data: values,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// เริ่มโหลดข้อมูลเมื่อเปิดหน้า
loadDashboardData();
