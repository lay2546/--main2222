import { db, auth } from './firebase.js';
import {
  collection, addDoc, serverTimestamp, getDoc, doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // Sidebar
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-btn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  menuBtn?.addEventListener("click", () => toggleSidebar(true));
  closeBtn?.addEventListener("click", () => toggleSidebar(false));
  overlay?.addEventListener("click", () => toggleSidebar(false));

  function toggleSidebar(show) {
    sidebar?.classList.toggle("show", show);
    overlay?.classList.toggle("show", show);
  }

  // Dropdown
  document.querySelectorAll(".dropdown-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dropdownContent = btn.nextElementSibling;
      dropdownContent?.classList.toggle("show");
    });
  });

  // Auth state (Firebase จริง)
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginModal = document.getElementById("login-modal");

  onAuthStateChanged(auth, (user) => {
    loginBtn?.classList.toggle("hidden", !!user);
    logoutBtn?.classList.toggle("hidden", !user);
  });

  logoutBtn?.addEventListener("click", async () => {
    await auth.signOut();
    window.location.reload();
  });

  // Cart
  const cartCount = document.getElementById("cart-count");
  const cartItems = document.getElementById("cart-items");
  const clearCart = document.getElementById("clear-cart");
  const totalPriceElement = document.getElementById("total-price");
  const totalItemsElement = document.getElementById("total-items");
  const checkoutBtn = document.getElementById("checkout");

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // แสดงตะกร้าทันที
  renderCart();

  function updateCartCount() {
    let totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCount.textContent = `(${totalItems})`;
  }

  function calculateTotalPrice() {
    let total = cart.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
    totalPriceElement.textContent = total.toFixed(2);
    totalItemsElement.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  function renderCart() {
    cartItems.innerHTML = "";
    if (cart.length === 0) {
      cartItems.innerHTML = "<li class='text-center text-gray-500'>ไม่มีสินค้าในตะกร้า 🛒</li>";
    } else {
      cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center p-2 border-b";
        li.innerHTML = `
          <span>${item.name} (x${item.quantity || 1}) - ฿${item.price}</span>
          <div class="flex items-center gap-2">
            <button class="decrease-qty" data-index="${index}">➖</button>
            <span>${item.quantity || 1}</span>
            <button class="increase-qty" data-index="${index}">➕</button>
            <button class="remove-item text-red-500" data-index="${index}">❌</button>
          </div>
        `;
        cartItems.appendChild(li);
      });
    }
    calculateTotalPrice();
    updateCartCount();
  }

  cartItems.addEventListener("click", (event) => {
    let index = event.target.dataset.index;
    if (event.target.classList.contains("increase-qty")) {
      cart[index].quantity = (cart[index].quantity || 1) + 1;
    } else if (event.target.classList.contains("decrease-qty")) {
      if (cart[index].quantity > 1) {
        cart[index].quantity--;
      } else {
        cart.splice(index, 1);
      }
    } else if (event.target.classList.contains("remove-item")) {
      cart.splice(index, 1);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  });

  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-to-cart")) {
      const user = auth.currentUser;
      if (!user) {
        alert("❌ กรุณาล็อกอินก่อนเพิ่มสินค้า");
        loginModal?.classList.remove("hidden");
        return;
      }

      let name = event.target.dataset.name;
      let price = event.target.dataset.price;
      let existingItem = cart.find(item => item.name === name);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({ name, price, quantity: 1 });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    }
  });

  clearCart?.addEventListener("click", () => {
    localStorage.removeItem("cart");
    cart = [];
    renderCart();
  });

  // ✅ Checkout: บันทึกจริง Firestore พร้อมข้อมูลผู้ใช้
  async function submitOrder() {
    const user = auth.currentUser;
    if (!user) {
      alert("กรุณาล็อกอินก่อนทำการสั่งซื้อ");
      loginModal?.classList.remove("hidden");
      return;
    }

    if (cart.length === 0) {
      alert("ไม่มีสินค้าในตะกร้า");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const name = userData.name || "";
      const phone = userData.phone || "";
      const address = userData.address || "";

      // ✅ ถ้ายังไม่มีที่อยู่ → ส่งไปหน้าเพิ่มที่อยู่
      if (!userData.address || userData.address.trim() === "") {
        alert("❗ กรุณากรอกข้อมูลที่อยู่ก่อนทำการสั่งซื้อ");
        window.location.href = "Delivery.html";
        return;
      }

      const methodSelect = document.getElementById("payment-method");
      const paymentMethod = methodSelect?.value || "cod";

      let slipUrl = "";
      if (paymentMethod === "transfer") {
        slipUrl = currentSlipUrl;
        if (!slipUrl) {
          alert("กรุณาอัปโหลดสลิปโอนเงิน");
          return;
        }
      }

      await addDoc(collection(db, "orders"), {
        uid: user.uid,
        name,
        phone,
        address,
        cart,
        paymentMethod,
        slipUrl,
        createdAt: serverTimestamp()
      });

      alert("✅ สั่งซื้อเรียบร้อยแล้ว!");
      localStorage.removeItem("cart");
      window.location.href = "orderhistory.html";
    } catch (error) {
      console.error("❌ Error submitting order:", error);
      alert("ไม่สามารถทำการสั่งซื้อได้");
    }
  }

  checkoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    confirmModal?.classList.remove('hidden');
  });

  // === Payment method & slip preview ===
  const paymentMethod = document.getElementById('payment-method');
  const slipUpload = document.getElementById('slip-upload-container');
  const qrPreview = document.getElementById("qr-preview");

  paymentMethod?.addEventListener('change', function () {
    if (paymentMethod.value === 'transfer') {
      slipUpload.classList.remove('hidden');
      qrPreview.classList.remove('hidden');

      const qrCanvas = document.getElementById("qr-canvas");
      const amount = totalPriceElement?.textContent || "0.00";

      // 🔁 กำหนดเบอร์ PromptPay หรือบัญชีผู้รับเงินจริง
      const qrData = `promptpay.io/0642715511${amount}`;
      QRCode.toCanvas(qrCanvas, qrData, {
        width: 200,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      });
    } else {
      slipUpload.classList.add('hidden');
      qrPreview.classList.add('hidden');
    }
  });

  // ฟังก์ชันอัปโหลดสลิปไป Cloudinary
  const uploadSlipToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "upload-slip"); // ใส่ชื่อ upload preset
    const res = await fetch("https://api.cloudinary.com/v1_1/dpgru06ox/image/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.secure_url; // ลิงก์ที่ได้จาก Cloudinary
  };

  // --- เพิ่มตัวแปรเก็บ slip url ---
  let currentSlipUrl = "";

  // เมื่อเลือกไฟล์สลิป ให้ upload ทันทีและแสดง preview
  slipInput?.addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (file) {
      // อัปโหลดไป Cloudinary
      currentSlipUrl = await uploadSlipToCloudinary(file);
      slipPreview.src = currentSlipUrl;
      slipPreview.classList.remove('hidden');
    }
  });

  // === Confirm modal ===
  const confirmModal = document.getElementById('confirm-modal');
  const confirmSubmit = document.getElementById('confirm-submit');
  const cancelSubmit = document.getElementById('cancel-submit');

  checkoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    confirmModal?.classList.remove('hidden');
  });

  cancelSubmit?.addEventListener('click', () => {
    confirmModal?.classList.add('hidden');
  });

  confirmSubmit?.addEventListener('click', async () => {
    confirmModal?.classList.add('hidden');
    await submitOrder();
  });

  // ✅ เพิ่มส่วนนี้
  const registerModal = document.getElementById("register-modal");

  document.getElementById("login-btn")?.addEventListener("click", () => {
    loginModal?.classList.remove("hidden");
  });

  document.getElementById("close-login-modal")?.addEventListener("click", () => {
    loginModal?.classList.add("hidden");
  });

  document.getElementById("openRegister")?.addEventListener("click", () => {
    loginModal?.classList.add("hidden");
    registerModal?.classList.remove("hidden");
  });

  document.getElementById("close-register-modal")?.addEventListener("click", () => {
    registerModal?.classList.add("hidden");
  });

  document.getElementById("backToLogin")?.addEventListener("click", () => {
    registerModal?.classList.add("hidden");
    loginModal?.classList.remove("hidden");
  });
});
