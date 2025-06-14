import { db } from './firebase.js';
import {
  collection, query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const productList = document.getElementById("product-list");

const q = query(collection(db, "products"), where("category", "==", "bakery"));

onSnapshot(q, (snapshot) => {
  productList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <img src="${data.imageUrl}" alt="${data.name}" class="product-image">
      <div class="product-details">
        <h3 class="product-title">${data.name}</h3>
        <p class="product-price">฿${data.price}</p>
        <button class="add-to-cart" data-name="${data.name}" data-price="${data.price}">🛒 หยิบใส่ตะกร้า</button>
      </div>
    `;
    productList.appendChild(div);
  });
});
    