<div align="center">

# Daily Shopping — Backend

### Node.js REST API Server

[![Node.js](https://img.shields.io/badge/Node.js-v20.x_LTS-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)
[![Mongoose](https://img.shields.io/badge/Mongoose-8.18.2-880000?style=flat-square)](https://mongoosejs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101?style=flat-square&logo=socketdotio)](https://socket.io/)
[![Firebase](https://img.shields.io/badge/Firebase_Admin-13.5.0-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Confidential-red?style=flat-square)](#)

**Production-grade Express.js REST API for Daily Shopping — handling auth, orders, coupon draws, payments, and real-time events.**

[Tech Stack](#-tech-stack) · [API Reference](#-api-reference) · [Database](#-database) · [Security](#-security) · [Setup](#-getting-started)

</div>

---

## Overview

This is the backend server for **Daily Shopping**, built with Node.js v20 and Express.js v5. It exposes a RESTful API consumed by the React frontend and Flutter mobile app. It handles authentication (JWT + Firebase), order management, the real-time coupon draw engine (Socket.IO), image processing (Sharp + Google Vision), and email notifications (Nodemailer).

| Field | Details |
|---|---|
| **Runtime** | Node.js v20.x LTS (minimum v18.x LTS) |
| **Framework** | Express.js v5.1.0 |
| **Module System** | ES Modules — `import/export` (`type: module`) |
| **Entry Point** | `server.js` |
| **Dev Watcher** | Nodemon v3.1.10 |
| **Package Manager** | npm |
| **Dev Start** | `npm run dev` → nodemon server.js |
| **Prod Start** | `npm start` → node server.js |
| **Install** | `npm install --legacy-peer-deps` |

---

## Features

### 🔐 Authentication
- Phone + Password login with JWT access and refresh tokens
- OTP verification via SMTP email
- Google social login verification via Firebase Admin SDK
- Forgot password — OTP → verify → reset flow
- Short-lived access token + long-lived refresh token rotation
- bcrypt password hashing (12 salt rounds)
- HttpOnly, Secure, SameSite cookie management

### 📦 Products & Categories
- Full product CRUD with image upload and auto-resize via Sharp
- Multi-image per product — WebP/JPEG conversion and compression
- AI-based image content moderation via Google Cloud Vision
- Perceptual duplicate image detection via `image-hash`
- SEO-friendly URL slug generation via `slugify`
- 350+ category tree with unlimited sub-category nesting
- Image-based product search via Google Vision AI

### 🛍️ Orders & Payments
- Create orders via bKash, Cash on Delivery, or Wallet
- Full order status lifecycle management
- PDF invoice generation (jsPDF + jspdf-autotable) server-side
- Payment webhook handling — all callbacks processed server-side only
- Cancellation and wallet refund processing

### 🎟️ Coupon Draw Engine
- Admin creates coupon pool with defined ticket count
- Real-time sold/remaining counter via Socket.IO
- Auto draw trigger on 100% ticket sell-out
- Cryptographically seeded random winner selection
- Draw result broadcast to all holders via WebSocket
- Pre-draw cancellation with bulk refund to wallet

### 💰 Wallet & Referral
- Internal wallet — credit, debit, withdrawal requests
- Admin approval/rejection of withdrawal requests
- Full transaction ledger with timestamps
- Referral reward crediting on new user registration
- Multi-level referral chain tracking

### 📧 Notifications
- SMTP email via Nodemailer — OTP, order confirmation, draw results, admin alerts
- Real-time in-app notifications via Socket.IO
- SMS/push notification support
- Admin bulk messaging to all or filtered users

### ⚙️ Admin APIs
- User management — block/unblock, role assignment, balance adjustment
- Product and category CRUD with bulk operations
- Order status, shipping tracking, payment updates
- Coupon pool management and draw history
- Sales reports — daily/weekly/monthly, exportable to PDF/Excel/CSV
- CMS — banner management, blog posts, FAQ, Terms & Privacy
- Audit log — all admin actions with timestamp and IP

---

## Tech Stack

### Core

| Package | Version | Role |
|---|---|---|
| express | ^5.1.0 | REST API framework, routing, middleware |
| mongoose | ^8.18.2 | MongoDB ODM — schema, models, queries |
| nodemon | ^3.1.10 | Dev file watcher with auto-restart |
| dotenv | ^17.2.2 | Environment variable loader from `.env` |

### Authentication & Security

| Package | Version | Role |
|---|---|---|
| jsonwebtoken | ^9.0.3 | JWT generation and verification |
| bcryptjs | ^3.0.3 | Secure password hashing (bcrypt) |
| firebase-admin | ^13.5.0 | Server-side Firebase token verification |
| cookie-parser | ^1.4.7 | HTTP cookie parsing middleware |
| cors | ^2.8.5 | CORS middleware with origin whitelist |

### File Handling & Image Processing

| Package | Version | Role |
|---|---|---|
| multer | ^2.0.2 | Multipart/form-data file upload middleware |
| sharp | ^0.34.5 | Image resize, crop, compress, WebP convert |
| jimp | ^1.6.0 | JS image manipulation — watermarks, filters |
| canvas | ^3.2.0 | Server-side HTML5 Canvas API |
| image-hash | ^6.0.1 | Perceptual hashing for duplicate detection |
| @google-cloud/vision | ^5.3.4 | Google Vision AI — content analysis |

### Communication

| Package | Version | Role |
|---|---|---|
| nodemailer | ^7.0.10 | SMTP email service |
| socket.io | ^4.x | Real-time WebSocket server |
| axios | ^1.12.2 | HTTP client for external API calls |
| node-fetch | ^3.3.2 | Fetch API polyfill for Node.js |
| form-data | ^4.0.4 | Multipart form-data for external APIs |

### Utilities

| Package | Version | Role |
|---|---|---|
| nanoid | ^5.1.6 | Compact, URL-safe unique ID generator |
| uuid | ^13.0.0 | RFC 4122 UUID generator |
| slugify | ^1.6.6 | SEO-friendly URL slug from product title |

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | ❌ | Login with phone + password |
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/send-otp-data` | ❌ | Send OTP to phone number |
| `POST` | `/api/auth/verify-otp` | ❌ | Verify OTP code |
| `POST` | `/api/auth/google-register` | ❌ | Google social sign-in / register |
| `POST` | `/api/auth/forgots-sends-otp` | ❌ | Send OTP for password reset |
| `POST` | `/api/auth/forgot-verify-otp` | ❌ | Verify password reset OTP |
| `POST` | `/api/auth/reset-password` | ❌ | Reset password with new value |
| `GET` | `/api/auth/me/:userId` | 🔒 JWT | Get user profile |
| `PUT` | `/api/auth/update/:userId` | 🔒 JWT | Update user profile |
| `DELETE` | `/api/auth/delete/:userId` | 🔒 JWT | Delete user account |
| `GET` | `/api/auth/my-referrals/:code` | 🔒 JWT | Get referral list by code |

**Login Request Body:**
```json
{
  "identifier": "01722327518",
  "password": "yourpassword"
}
```

**Login Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "phoneNumber": "01722327518",
    "displayName": "User Name",
    "role": "user"
  }
}
```

---

### Products — `/api/products`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products/newlatestproduct` | ❌ | Latest products (paginated) |
| `GET` | `/api/products/details/:productId` | ❌ | Single product detail |
| `POST` | `/api/products/image-search` | ❌ | Image-based product search |
| `POST` | `/api/products/:productId/reviewmobile` | 🔒 JWT | Submit product review with photos |

**Query Params for latest products:**

| Param | Type | Example |
|---|---|---|
| page | number | `8` |
| limit | number | `16` |

**Response:**
```json
{
  "page": 8,
  "limit": 16,
  "total": 117,
  "isLastPage": false,
  "data": [ ... ]
}
```

---

### Landing Page

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/promosection` | ❌ | Banner-1 promo section |
| `GET` | `/api/promocardsection` | ❌ | Banner-2 promo cards |
| `GET` | `/api/carousel` | ❌ | Banner-3 carousel |
| `GET` | `/api/popularcategory` | ❌ | Popular categories |
| `GET` | `/api/categorybanner` | ❌ | Category banner |
| `GET` | `/api/brands` | ❌ | Brands list |

---

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/my-orders?userAuth=` | 🔒 JWT | Get user's order list |
| `POST` | `/api/orders/bkash/create` | 🔒 JWT | Place order via bKash |
| `POST` | `/api/orders/cod` | 🔒 JWT | Place Cash on Delivery order |
| `POST` | `/api/orders/wallet-pays` | 🔒 JWT | Place order via Wallet |
| `DELETE` | `/api/orders/:orderId?userAuth=` | 🔒 JWT | Delete order |

**Order Request Body (bKash):**
```json
{
  "customer": {
    "name": "Customer Name",
    "phone": "01746445559",
    "address": "Dhaka, Bangladesh"
  },
  "totals": {
    "quantity": 1,
    "subtotal": 250,
    "shipping": 60,
    "grandtotal": 310
  },
  "paymentInfo": {
    "trxID": "CKE27XI2C0",
    "amount": 310,
    "phone": "01746445559"
  },
  "products": [
    {
      "title": "Product Name",
      "ProductPrice": 250,
      "quantity": 1,
      "_id": "..."
    }
  ],
  "status": "hold",
  "orderPayment": "paid",
  "paymentMethod": "bKash",
  "userAuth": "01746445559"
}
```

---

### Coupons — `/api/coupons`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/coupons/my?email=&phone=` | 🔒 JWT | Get user's coupons |
| `POST` | `/api/coupons/purchase` | 🔒 JWT | Purchase coupon via bKash |
| `POST` | `/api/coupons/walletcoupon` | 🔒 JWT | Purchase coupon via Wallet |
| `GET` | `/api/coupons/winners` | ❌ | Public winner statistics |
| `GET` | `/api/coupons/activedata?email=&phone=` | 🔒 JWT | Active coupons for user |
| `GET` | `/api/coupons/winnersdata?phone=&email=` | 🔒 JWT | User's win history |

**Coupon Purchase Body (bKash):**
```json
{
  "productId": "6926e20dc9e0c67280b24ebc",
  "productName": "Monitor",
  "productImage": "https://...",
  "price": 10,
  "quantity": 1,
  "username": "Test User",
  "useremail": "test@gmail.com",
  "userPhone": "01800000000",
  "userRegPhone": "01800000000",
  "couponlimit": 100,
  "isSandbox": false
}
```

---

### Wallet — `/api/wallet`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/wallet/add` | 🔒 JWT | Add balance to wallet |
| `POST` | `/api/wallet/wallet/create` | 🔒 JWT | Fund wallet via bKash |
| `POST` | `/api/wallet/withdraw-request` | 🔒 JWT | Submit withdrawal request |
| `GET` | `/api/wallet/my-requests/:userId` | 🔒 JWT | Get withdrawal history |

**Withdrawal Request Body:**
```json
{
  "userId": "68eb885fb3f4ba8af84f46a8",
  "amount": 500,
  "method": "bKash",
  "paymentNumber": "01722327518"
}
```

---

### User Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/wishlist?email=&phone=` | 🔒 JWT | Get wishlist items |
| `POST` | `/api/wishlist` | 🔒 JWT | Add item to wishlist |
| `GET` | `/api/notification/:userId` | 🔒 JWT | Get notifications |

---

## Database

### Technology

| Field | Details |
|---|---|
| **Engine** | MongoDB — NoSQL Document Database |
| **ODM** | Mongoose v8.18.2 |
| **Architecture** | Single Layer — no read replica at app level |
| **Data Format** | BSON (Binary JSON) |
| **Hosting** | MongoDB Atlas (Cloud — recommended) |
| **Connection** | Mongoose built-in connection pool |
| **Query Language** | Mongoose Query API + Aggregation Pipeline |
| **Backup** | MongoDB Atlas automated daily + point-in-time |

### Collections

| Collection | Description |
|---|---|
| `users` | Accounts, credentials, wallet balance, referral codes, roles |
| `products` | Catalog — pricing, stock, images, variants, SEO slugs |
| `categories` | Hierarchical tree — 350+ categories, unlimited sub-nesting |
| `orders` | Direct purchase orders — line items, status, delivery, payment |
| `coupons` | 10 BDT tickets — product ref, owner, draw status |
| `draws` | Draw events — winner, total coupons, timestamp, history |
| `transactions` | Financial ledger — purchases, wallet credits, refunds |
| `notifications` | In-app, email, SMS records with read/unread status |
| `banners` | CMS — homepage banners, sliders, promo blocks |
| `blogs` | Posts, news, FAQ, Terms & Privacy Policy |
| `settings` | Global config — payment keys, referral rules |
| `adminLogs` | Admin audit trail — actions, timestamps, IP addresses |

---

## Security

| Layer | Implementation |
|---|---|
| JWT Auth | `jsonwebtoken` v9.0.3 — access + refresh token strategy |
| Social Auth | Firebase Admin SDK v13.5.0 — server-side token verification |
| Password Hashing | bcryptjs — bcrypt algorithm, **12 salt rounds** |
| Token Strategy | Short-lived access token + long-lived refresh token rotation |
| Cookie Security | HttpOnly + Secure + SameSite via `cookie-parser` |
| CORS | Explicit `CLIENT_URL` whitelist — no wildcard origins |
| HTTPS | Nginx with TLS 1.2/1.3 + HSTS headers |
| Rate Limiting | `express-rate-limit` on login, register, and payment endpoints |
| Input Validation | Express middleware on all routes |
| File Validation | Multer — strict MIME type check + max file size limit |
| NoSQL Injection | Mongoose schema validation on all incoming data |
| Secrets | All API keys in `.env` — never hardcoded in source |
| IP Restriction | Admin panel configurable IP whitelist |
| Admin 2FA | Mandatory OTP two-factor auth on every admin login |
| Audit Log | All admin actions recorded: actor + action + timestamp + IP |

---

## Real-Time Events (Socket.IO)

```js
// Order events
io.emit('order:created', { orderId, userAuth })
io.emit('order:status_updated', { orderId, status })
io.emit('order:delivered', { orderId })

// Draw events
io.emit('draw:started', { productId, totalTickets })
io.emit('draw:result', { productId, winnerId })
io.emit('draw:winner_announced', { winner, product })

// Coupon events
io.emit('coupon:sold', { productId, remaining })
io.emit('coupon:pool_filled', { productId })
io.emit('coupon:refunded', { productId, userId })

// Notification events
io.to(userId).emit('notification:new', { message })

// User events
io.to(userId).emit('user:balance_updated', { balance })
io.to(userId).emit('user:blocked')
```

---

## Email Templates (Nodemailer)

| Trigger | Recipient | Content |
|---|---|---|
| Registration | User | Welcome email |
| OTP | User | Verification code |
| Order Placed | User | Order confirmation |
| Order Status | User | Status update |
| Order Delivered | User | Delivery notification |
| Draw Result | Winner | Congratulation + prize details |
| Draw Result | Participants | Result notification |
| New Order | Admin | Order alert |
| Low Stock | Admin | Stock alert |
| Withdrawal | Admin | Withdrawal request alert |

---

## Getting Started

### Prerequisites

- Node.js v20.x LTS
- MongoDB Atlas account
- Firebase project with Admin SDK service account
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/luckyshop-server.git
cd luckyshop-server

# Install dependencies
npm install 

# Setup environment variables
cp .env.example .env
# Fill in your credentials

# Start development server
npm run dev

# Start production server
npm start
```

---

## Environment Variables

```env
# ── Database ──────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/luckyshop

# ── JWT ───────────────────────────────────────────────────
JWT_SECRET=your_strong_jwt_secret_minimum_32_chars
JWT_REFRESH_SECRET=your_strong_refresh_secret

# ── Firebase Admin SDK ────────────────────────────────────
FIREBASE_ADMIN_KEY={"type":"service_account","project_id":"..."}

# ── Email (SMTP) ──────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# ── bKash Payment ─────────────────────────────────────────
BKASH_STORE_ID=your_bkash_store_id
BKASH_PASSWORD=your_bkash_password

# ── CORS ──────────────────────────────────────────────────
CLIENT_URL=https://luckyshop.com.bd

# ── Google Cloud Vision ───────────────────────────────────
GOOGLE_CLOUD_KEY_FILE=./google-vision-key.json

# ── Server ────────────────────────────────────────────────
PORT=5000
NODE_ENV=production
```

---

## Project Structure

```
luckyshop-server/
├── server.js                     # Entry point — Express + Socket.IO init
├── .env
├── package.json
│
├── routes/
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── order.routes.js
│   ├── coupon.routes.js
│   ├── wallet.routes.js
│   ├── wishlist.routes.js
│   ├── notification.routes.js
│   └── admin/
│       ├── users.routes.js
│       ├── products.routes.js
│       ├── orders.routes.js
│       ├── coupons.routes.js
│       ├── reports.routes.js
│       └── settings.routes.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── product.controller.js
│   ├── order.controller.js
│   ├── coupon.controller.js
│   └── wallet.controller.js
│
├── models/
│   ├── User.model.js
│   ├── Product.model.js
│   ├── Category.model.js
│   ├── Order.model.js
│   ├── Coupon.model.js
│   ├── Draw.model.js
│   ├── Transaction.model.js
│   └── Notification.model.js
│
├── middleware/
│   ├── auth.middleware.js        # JWT verification
│   ├── admin.middleware.js       # Role-based access
│   └── upload.middleware.js      # Multer config
│
└── utils/
    ├── sendEmail.js              # Nodemailer helper
    ├── generateToken.js          # JWT helper
    └── imageProcessor.js         # Sharp helper
```

---

## Production Deployment (PM2 + Nginx)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name luckyshop-api

# Save process list
pm2 save
pm2 startup
```

```nginx
# Nginx config
server {
    listen 443 ssl;
    server_name serverluckyshop.luckyshop.com.bd;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

<div align="center">

Prepared by **Quicktech IT Service Provider**

📞 +88 01993335988 &nbsp;|&nbsp; 📧 info@quicktech-ltd.com &nbsp;|&nbsp; 🌐 www.quicktech-ltd.com

*STRICTLY CONFIDENTIAL — Client Use Only*

</div>
