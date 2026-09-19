// =====================================================================
// routes/adminCommission.js
//
// Admin commission report — shob DELIVERED order, commission ekhanei hisab hoy
//   - order e adminEarning / sellerEarning save thakle seta use kore
//   - na thakle   Price x Qty x Commission%   diye hisab kore
//   - referralRedeem.used = true hole referral amount admin er commission
//     theke minus hoy (refunded hole minus hoy na)
//
// Endpoint:  GET /api/admin-commission?page=1&limit=25&search=abc
// =====================================================================

import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// field string/null/missing jai hok, number e convert kore
const num = (input, fallback = 0) => ({
  $convert: { input, to: "double", onError: fallback, onNull: fallback },
});

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const search = String(req.query.search || "").trim();

    const pipeline = [
      // 1) Shudhu delivered order
      { $match: { status: /^delivered$/i } },

      // 2) Prottek product line alada kore hisab korbo
      { $unwind: "$products" },
      {
        $addFields: {
          _price: num("$products.ProductPrice"),
          _qty: num("$products.quantity", 1),
          _pwd: num("$products.productwiseDiscount"),
          _adm: num("$products.adminCommission"),
          _storedAdmin: num("$products.adminEarning"),
          _storedSeller: num("$products.sellerEarning"),
        },
      },
      {
        $addFields: {
          // productwiseDiscount thakle oita, na thakle adminCommission %
          _percent: { $cond: [{ $gt: ["$_pwd", 0] }, "$_pwd", "$_adm"] },
          _lineTotal: { $multiply: ["$_price", "$_qty"] },
        },
      },
      {
        $addFields: {
          _adminEarning: {
            $cond: [
              { $gt: ["$_storedAdmin", 0] },
              "$_storedAdmin",
              { $divide: [{ $multiply: ["$_lineTotal", "$_percent"] }, 100] },
            ],
          },
        },
      },
      {
        $addFields: {
          _sellerEarning: {
            $cond: [
              { $gt: ["$_storedSeller", 0] },
              "$_storedSeller",
              { $subtract: ["$_lineTotal", "$_adminEarning"] },
            ],
          },
        },
      },

      // 3) Abar order onujayi ek kore (ek order = ek row)
      {
        $group: {
          _id: "$_id",
          paymentId: { $first: "$paymentId" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          customerName: { $first: "$customer.name" },
          referralUsed: { $first: "$referralRedeem.used" },
          referralRefunded: { $first: "$referralRedeem.refunded" },
          referralAmount: { $first: "$referralRedeem.amount" },
          products: {
            $push: {
              title: "$products.title",
              shopName: { $ifNull: ["$products.shopName", "$shopName"] },
              sellerId: { $ifNull: ["$products.sellerId", "$sellerId"] },
              quantity: "$_qty",
              price: "$_price",
              commissionPercent: "$_percent",
              adminEarning: "$_adminEarning",
              sellerEarning: "$_sellerEarning",
            },
          },
          totalSales: { $sum: "$_lineTotal" },
          adminCommission: { $sum: "$_adminEarning" },
          sellerEarning: { $sum: "$_sellerEarning" },
        },
      },

      // 4) Referral discount — order e ekbar-i minus hobe
      {
        $addFields: {
          referralDeduction: {
            $cond: [
              {
                $and: [
                  { $eq: ["$referralUsed", true] },
                  { $ne: ["$referralRefunded", true] },
                ],
              },
              num("$referralAmount"),
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          netAdminEarning: { $subtract: ["$adminCommission", "$referralDeduction"] },
        },
      },
    ];

    // 5) Search (order id, product, shop, seller id)
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      pipeline.push({
        $match: {
          $or: [
            { paymentId: rx },
            { "products.title": rx },
            { "products.shopName": rx },
            { "products.sellerId": rx },
            { customerName: rx },
          ],
        },
      });
    }

    // 6) Ek query te page er rows + total summary
    pipeline.push({
      $facet: {
        rows: [
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],
        summary: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSales: { $sum: "$totalSales" },
              adminCommission: { $sum: "$adminCommission" },
              referralDeduction: { $sum: "$referralDeduction" },
              netAdminEarning: { $sum: "$netAdminEarning" },
              sellerPayout: { $sum: "$sellerEarning" },
            },
          },
        ],
      },
    });

    const [out] = await Order.aggregate(pipeline);
    const s = out?.summary?.[0] || {};
    const totalRows = s.totalOrders || 0;

    const rows = (out?.rows || []).map((o) => ({
      _id: o._id,
      paymentId: o.paymentId,
      createdAt: o.createdAt,
      customerName: o.customerName || "",
      totalSales: round2(o.totalSales),
      adminCommission: round2(o.adminCommission),
      referralDeduction: round2(o.referralDeduction),
      netAdminEarning: round2(o.netAdminEarning),
      sellerEarning: round2(o.sellerEarning),
      products: (o.products || []).map((p) => ({
        ...p,
        price: round2(p.price),
        commissionPercent: round2(p.commissionPercent),
        adminEarning: round2(p.adminEarning),
        sellerEarning: round2(p.sellerEarning),
      })),
    }));

    res.json({
      success: true,
      summary: {
        totalOrders: totalRows,
        totalSales: round2(s.totalSales),
        adminCommission: round2(s.adminCommission),
        referralDeduction: round2(s.referralDeduction),
        netAdminEarning: round2(s.netAdminEarning),
        sellerPayout: round2(s.sellerPayout),
      },
      rows,
      pagination: {
        page,
        limit,
        totalRows,
        totalPages: Math.max(1, Math.ceil(totalRows / limit)),
      },
    });
  } catch (err) {
    console.error("admin-commission error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;