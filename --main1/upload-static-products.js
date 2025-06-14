
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ✅ รายการสินค้าแบบสมบูรณ์ (ใส่ URL รูปจริงจาก Firebase Storage ก่อนใช้งานจริง)
const products = [
  {
    name: "Kale Smoothie",
    price: 50,
    unit: "ขวด",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT/o/kale_smoothie.jpg?alt=media",
    category: "smoothie"
  },
  {
    name: "Strawberry & Raspberry Smoothie",
    price: 50,
    unit: "ขวด",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT/o/strawberry_raspberry.jpg?alt=media",
    category: "smoothie"
  },
  {
    name: "Passion Fruit Smoothie",
    price: 50,
    unit: "ขวด",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT/o/passion_fruit.jpg?alt=media",
    category: "smoothie"
  },
  {
    name: "Peach & Apricot Smoothie",
    price: 50,
    unit: "ขวด",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT/o/peach_apricot.jpg?alt=media",
    category: "smoothie"
  },
  {
    name: "Yogurt Bowl Set",
    price: 75,
    unit: "เซ็ต",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT/o/yogurt_bowl.jpg?alt=media",
    category: "smoothie"
  },
  {
    name: "Mini Yogurt Set",
    price: 45,
    unit: "เซ็ต",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT/o/mini_yogurt.jpg?alt=media",
    category: "smoothie"
  },
  {
    name: "Acai หรือ Avocado Bowl Set",
    price: 90,
    unit: "เซ็ต",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT/o/acai_avocado.jpg?alt=media",
    category: "smoothie"
  },
  {
    name: "Chia Seed Bowl Set",
    price: 95,
    unit: "เซ็ต",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT/o/chia_seed.jpg?alt=media",
    category: "smoothie"
  },
  {
    name: "Rambutan Jelly",
    price: 45,
    unit: "ถ้วย",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT/o/rambutan_jelly.jpg?alt=media",
    category: "smoothie"
  }
];

// 🚀 อัปโหลดสินค้าไปยัง Firestore
products.forEach(async (product) => {
  try {
    await addDoc(collection(db, "products"), {
      ...product,
      createdAt: serverTimestamp()
    });
    console.log(`✅ เพิ่มแล้ว: ${product.name}`);
  } catch (error) {
    console.error(`❌ เพิ่มล้มเหลว: ${product.name}`, error);
  }
});
