// import admin from "firebase-admin";
// import fs from "fs";
// import path from "path";

// const serviceAccount = JSON.parse(
//   fs.readFileSync(path.resolve("./firebase-service-account.json"), "utf-8")
// );

// // Initialize Firebase Admin only once
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }
// const messaging = admin.messaging();

// // ✅ Export admin directly
// export { messaging };
// export default admin;


import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // ✅ Render (production) — env variable থেকে পড়বে
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // ✅ Local development — ফাইল থেকে পড়বে
  const filePath = path.resolve("./firebase-service-account.json");
  if (fs.existsSync(filePath)) {
    serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
}

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.warn("⚠️ Firebase service account not found — Firebase features disabled.");
  }
}

const messaging = admin.apps.length ? admin.messaging() : null;

// ✅ Export admin directly
export { messaging };
export default admin;