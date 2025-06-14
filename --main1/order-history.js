import { db, auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const orderList = document.getElementById("order-list");
  orderList.innerHTML = "<li class='text-center text-gray-500'>⏳ กำลังโหลดข้อมูล...</li>";

  // ✅ ส่วนแสดงและแก้ไขที่อยู่ล่าสุด
  const addressInfo = document.getElementById("address-info");
  const editAddressBtn = document.getElementById("edit-address-btn");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("❌ กรุณาเข้าสู่ระบบก่อนดูประวัติคำสั่งซื้อ");
      window.location.href = "Home.html";
      return;
    }

    // ✅ โหลดข้อมูลที่อยู่ล่าสุด
    if (addressInfo && editAddressBtn) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        addressInfo.innerHTML = `
          <p><strong>ชื่อ:</strong> <span id="info-name">${data.name || "-"}</span></p>
          <p><strong>เบอร์โทร:</strong> <span id="info-phone">${data.phone || "-"}</span></p>
          <p><strong>ที่อยู่:</strong> <span id="info-address">${data.address || "-"}</span></p>
        `;
      }

      // ✅ ปุ่มแก้ไข
      editAddressBtn.addEventListener("click", async () => {
        const name = prompt("ชื่อใหม่:", document.getElementById("info-name").textContent);
        const phone = prompt("เบอร์โทรใหม่:", document.getElementById("info-phone").textContent);
        const address = prompt("ที่อยู่ใหม่:", document.getElementById("info-address").textContent);

        if (name && phone && address) {
          try {
            await setDoc(doc(db, "users", user.uid), { name, phone, address }, { merge: true });
            addressInfo.innerHTML = `
              <p><strong>ชื่อ:</strong> <span id="info-name">${name}</span></p>
              <p><strong>เบอร์โทร:</strong> <span id="info-phone">${phone}</span></p>
              <p><strong>ที่อยู่:</strong> <span id="info-address">${address}</span></p>
            `;
            alert("✅ แก้ไขที่อยู่เรียบร้อยแล้ว");
          } catch (err) {
            console.error("❌ update error", err);
            alert("เกิดข้อผิดพลาดในการอัปเดตที่อยู่");
          }
        }
      });
    }

    // ✅ โหลดประวัติการสั่งซื้อ
    try {
      const q = query(collection(db, "orders"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        orderList.innerHTML = "<li class='text-center text-gray-500'>ไม่มีประวัติการสั่งซื้อ</li>";
        return;
      }

      orderList.innerHTML = ""; // เคลียร์ loading
      querySnapshot.forEach((doc) => {
        const order = doc.data();
        const items = order.cart || [];

        const total = items.reduce((sum, item) =>
          sum + (item.quantity || 1) * parseFloat(item.price), 0).toFixed(2);

        const itemList = items.map(item => `
          <li class="ml-4">• ${item.name} x${item.quantity || 1} — ฿${item.price}</li>
        `).join("");

        const li = document.createElement("li");
        li.className = "bg-gray-100 p-4 rounded shadow";
        li.innerHTML = `
  <p><strong>🧾 หมายเลขคำสั่งซื้อ:</strong> ${doc.id}</p>
  <p><strong>👤 ชื่อผู้รับ:</strong> ${order.name || "-"}</p>
  <p><strong>📞 เบอร์โทร:</strong> ${order.phone || "-"}</p>
  <p><strong>🏠 ที่อยู่:</strong> ${order.address || "-"}</p>
  <p><strong>💰 ยอดรวม:</strong> ฿${total}</p>
  <p><strong>🗓️ เวลา:</strong> ${order.createdAt?.toDate().toLocaleString() || "-"}</p>
  <p><strong>💳 วิธีชำระเงิน:</strong> ${
    order.paymentMethod === "transfer"
      ? "โอนเงิน"
      : order.paymentMethod === "cod"
      ? "เก็บเงินปลายทาง"
      : order.paymentMethod || "-"
  }</p>
  <p><strong>📦 รายการสินค้า:</strong></p>
  <ul class="list-disc ml-5 mt-1">${itemList}</ul>
`;

        orderList.appendChild(li);
      });

    } catch (err) {
      console.error("🔥 Error loading orders:", err);
      orderList.innerHTML = "<li class='text-red-500'>❌ เกิดข้อผิดพลาดในการโหลดข้อมูล</li>";
    }
  });
});
