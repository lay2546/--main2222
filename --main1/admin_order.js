// OCR พร้อม logic ตรวจยอดละเอียดและ tolerant
import { db } from './firebase.js';
import {
  collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const tbody = document.getElementById('order-table-body');
const deleteSelectedBtn = document.getElementById('delete-selected');
const selectAllCheckbox = document.getElementById('select-all');
const grandTotalEl = document.getElementById("grand-total");
const filterDate = document.getElementById("filter-date");
const filterMonth = document.getElementById("filter-month");

let allOrders = [];

const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  allOrders = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const docId = docSnap.id;
    allOrders.push({ id: docId, ...data });
  });
  renderOrders();
});

function renderOrders() {
  tbody.innerHTML = "";
  let totalAllOrders = 0;

  const selectedDate = filterDate?.value;
  const selectedMonth = filterMonth?.value;

  const filteredOrders = allOrders.filter(order => {
    if (!order.createdAt) return false;
    const dateObj = order.createdAt.toDate();
    const dateStr = dateObj.toISOString().split('T')[0];
    const monthStr = (dateObj.getMonth() + 1).toString().padStart(2, '0');

    if (selectedDate && dateStr !== selectedDate) return false;
    if (selectedMonth && monthStr !== selectedMonth) return false;
    return true;
  });

  filteredOrders.forEach(data => {
    const docId = data.id;
    const cartItems = (data.cart || []).map(item =>
      `<li>${item.name} x${item.quantity || 1} - ฿${item.price}</li>`
    ).join("");

    const orderTotal = (data.cart || []).reduce((sum, item) =>
      sum + (item.quantity || 1) * parseFloat(item.price || 0), 0);
    totalAllOrders += orderTotal;

    const slipStatusId = `status-${docId}`;

    const paymentStatus = data.paymentMethod === 'transfer'
      ? (data.slipUrl
          ? `<span id="${slipStatusId}" class="text-gray-500 font-semibold">⏳ กำลังตรวจ...</span>`
          : '<span class="text-red-500 font-semibold">❌ ยังไม่ชำระ</span>')
      : '<span class="text-yellow-600 font-semibold">📦 เก็บปลายทาง</span>';

    const slipHtml = data.slipUrl
      ? `<div class="flex flex-col items-center">
           <a href="${data.slipUrl}" target="_blank">
             <img src="${data.slipUrl}" class="w-20 rounded shadow mb-1" />
           </a>
           <button onclick="verifySlip('${data.slipUrl}', '${orderTotal}', '${data.name}', '${docId}', true)" class="text-xs text-blue-500 hover:underline">🔍 ตรวจสลิป</button>
         </div>`
      : "-";

    const tr = document.createElement("tr");
    tr.classList.add("border-b");

    tr.innerHTML = `
      <td class="py-2 px-4 text-center">
        <input type="checkbox" class="select-order" data-id="${docId}" />
      </td>
      <td class="py-2 px-4">${data.name || "-"}</td>
      <td class="py-2 px-4">${data.phone || "-"}</td>
      <td class="py-2 px-4">${data.address || "-"}</td>
      <td class="py-2 px-4">${data.deliveryOption || "-"}</td>
      <td class="py-2 px-4"><ul class="list-disc pl-5">${cartItems}</ul></td>
      <td class="py-2 px-4">${data.createdAt?.toDate().toLocaleString() || "-"}</td>
      <td class="py-2 px-4 text-green-600 font-bold">฿${orderTotal.toFixed(2)}</td>
      <td class="py-2 px-4">${data.paymentMethod === "transfer" ? "โอนเงิน" : "เก็บปลายทาง"}</td>
      <td class="py-2 px-4">${slipHtml}</td>
      <td class="py-2 px-4">${paymentStatus}</td>
      <td class="py-2 px-4">
        <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded" data-id="${docId}">ลบ</button>
      </td>
    `;

    tbody.appendChild(tr);

    if (data.paymentMethod === 'transfer' && data.slipUrl) {
      verifySlip(data.slipUrl, orderTotal, data.name, docId, false);
    }
  });

  if (grandTotalEl) {
    grandTotalEl.textContent = totalAllOrders.toFixed(2);
  }
}

function preprocessImage(imageUrl, callback) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const high = gray > 180 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = high;
    }
    ctx.putImageData(imageData, 0, 0);
    callback(canvas.toDataURL());
  };
}

function fuzzyMatch(text, keyword) {
  let matchCount = 0;
  for (const char of keyword) {
    if (text.includes(char)) matchCount++;
  }
  return matchCount / keyword.length >= 0.8;
}

window.verifySlip = function (url, expectedTotal, expectedName, docId, manual = true) {
  preprocessImage(url, async (processedImage) => {
    const result = await Tesseract.recognize(processedImage, 'tha+eng', {
      tessedit_char_whitelist: '0123456789.,'
    });

    const text = result.data.text;
    const lines = text.split('\n').map(l => l.trim());
    const expected = Number(expectedTotal);

    let amountText = 'ไม่พบ';
    const amountCandidates = text.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2}/g) || [];
    for (const val of amountCandidates) {
      const num = parseFloat(val.replace(/,/g, ''));
      if (!isNaN(num) && Math.abs(num - expected) < 1) {
        amountText = val;
        break;
      }
    }

    const cleanAmount = parseFloat(amountText.replace(/[^\d.]/g, '').replace(',', '.'));
    const isAmountMatch = !isNaN(cleanAmount) && Math.abs(cleanAmount - expected) < 0.01;

    const nameText = text;
    const isNameMatch = fuzzyMatch(nameText, expectedName);

    const statusEl = document.getElementById(`status-${docId}`);
    const docRef = doc(db, "orders", docId);

    if (statusEl) {
      if (!isAmountMatch) {
        statusEl.innerHTML = `<span class='text-red-500 font-semibold'>❗ ยอดไม่ตรง (OCR: ${amountText})</span>`;
        await updateDoc(docRef, { paymentVerified: false });
      } else if (!isNameMatch) {
        statusEl.innerHTML = `<span class='text-red-500 font-semibold'>❗ ชื่อไม่ตรง</span>`;
        await updateDoc(docRef, { paymentVerified: false });
      } else {
        statusEl.innerHTML = `<span class='text-green-600 font-semibold'>✅ ตรงกับข้อมูล</span>`;
        await updateDoc(docRef, { paymentVerified: true });
      }
    }

    if (manual || (!isAmountMatch || !isNameMatch)) {
      alert(
        `📋 ผลตรวจสลิป:\n` +
        `ยอดบนสลิป: ${amountText}\n` +
        `ชื่อในสลิป: ${isNameMatch ? '✅ พบชื่อใกล้เคียง' : '❌ ไม่พบชื่อครบถ้วน'}\n\n` +
        `ยอดต้องชำระ: ฿${expectedTotal}\n` +
        `ชื่อที่ระบบต้องการ: ${expectedName}\n\n` +
        `ผลลัพธ์:\n- ยอด ${isAmountMatch ? '✅ ตรง' : '❌ ไม่ตรง'}\n- ชื่อ ${isNameMatch ? '✅ ตรง' : '❌ ไม่ตรง'}`
      );
    }
  });
};

tbody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    if (confirm("คุณต้องการลบออเดอร์นี้ใช่หรือไม่?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
        alert("✅ ลบเรียบร้อย");
      } catch (err) {
        console.error("❌ ลบไม่สำเร็จ:", err);
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    }
  }
});
