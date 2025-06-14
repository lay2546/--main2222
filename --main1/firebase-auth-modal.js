import { auth, db } from './firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("submit-login");
  const registerBtn = document.getElementById("submit-register");
  const loginNavBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const orderLink = document.getElementById("order-history-link");

  // 🔐 Login
  loginBtn?.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("เข้าสู่ระบบสำเร็จ!");
      document.getElementById("login-modal")?.classList.add("hidden");
      window.location.href = "Home.html";
    } catch (error) {
      alert("เข้าสู่ระบบล้มเหลว: " + error.message);
    }
  });

  // 📝 Register + Save to Firestore
  registerBtn?.addEventListener("click", async () => {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ บันทึกข้อมูลลง Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "user",
        createdAt: serverTimestamp()
      });

      alert("สมัครสมาชิกสำเร็จ!");
      document.getElementById("register-modal")?.classList.add("hidden");
      window.location.href = "Home.html";
    } catch (error) {
      alert("สมัครไม่สำเร็จ: " + error.message);
    }
  });

  // 🔄 Toggle Login/Register
  document.getElementById("openRegister")?.addEventListener("click", () => {
    document.getElementById("login-modal")?.classList.add("hidden");
    document.getElementById("register-modal")?.classList.remove("hidden");
  });
  document.getElementById("backToLogin")?.addEventListener("click", () => {
    document.getElementById("register-modal")?.classList.add("hidden");
    document.getElementById("login-modal")?.classList.remove("hidden");
  });

  // ❌ Logout
  logoutBtn?.addEventListener("click", async () => {
    await auth.signOut();
    alert("ออกจากระบบเรียบร้อยแล้ว");
    window.location.href = "Home.html";
  });

  // 👁️ Show/Hide Login-Logout
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginNavBtn?.classList.add("hidden");
      logoutBtn?.classList.remove("hidden");
      orderLink?.classList.remove("hidden");
    } else {
      loginNavBtn?.classList.remove("hidden");
      logoutBtn?.classList.add("hidden");
      orderLink?.classList.add("hidden");
    }
  });

  // ❎ ปิด modal
  document.getElementById("close-login-modal")?.addEventListener("click", () => {
    document.getElementById("login-modal")?.classList.add("hidden");
  });
  document.getElementById("close-register-modal")?.addEventListener("click", () => {
    document.getElementById("register-modal")?.classList.add("hidden");
  });
});
// 🛒 Fetch and Display Products
async function fetchProducts() {
  const productsContainer = document.getElementById("products-container");
  try {
    const querySnapshot = await db.collection("products").get();
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      const productElement = document.createElement("div");
      productElement.className = "product";
      productElement.innerHTML = `
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p>Price: ${product.price}</p>
      `;
      productsContainer.appendChild(productElement);
    });
  } catch (error) {
    console.error("Error fetching products: ", error);
  }
}

// Call fetchProducts on page load
fetchProducts();