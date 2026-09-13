// models/Product.js
import mongoose from "mongoose";
import { nanoid } from "nanoid";

const reviewSchema = new mongoose.Schema({
  userId: { type: String, default: "" },
  userAuth: String, // user email or phone
  username: { type: String, default: "Anonymous" },
  anonymous: { type: Boolean, default: false },

  // 🔗 Ties this review to the exact purchase it came from
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  itemId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Order.products[i]._id

  // 🛒 Snapshot of what was actually bought (so history stays accurate
  // even if the product listing changes later)
  color: { type: String, default: "" },
  size: { type: String, default: "" },
  productTitleSnapshot: { type: String, default: "" },
  productImgSnapshot: { type: String, default: "" },

  // ⭐ Product review
  rating: { type: Number, required: true },
  comment: { type: String, default: "" },
  photos: [String], // uploaded image URLs (imgbb)
  likes: { type: Number, default: 0 },

  // 🏪 Seller review
  sellerId: { type: String, default: "" },
  shopName: { type: String, default: "" },
  sellerRating: { type: Number, default: null }, // 0 = sad, 1 = neutral, 2 = happy
  sellerComment: { type: String, default: "" },

  // 🚚 Delivery review
  deliveryRating: { type: Number, default: null }, // 1-5 stars
  deliveryComment: { type: String, default: "" },

  date: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema(
  {
    productid: {
      type: String,
      default: () => nanoid(8).toUpperCase(), // 8 characters, uppercase
      unique: true,
    },
    title: { type: String, required: true },
    categoryName: String,
    supplier: { type: String, required: false },
    subcategoryName: String,
    childcategoryName: String,
    purchasePrice: Number,
    ProductPrice: Number,
    adminCommission: { type: Number, default: 0 },
    oldPrice: Number,
    discount: String,
    rating: Number,
    userHighestBuyCoupon: Number,
    stockWarning: Number,
    sold: Number,
    shop: String,
    totalcupon: Number,
    remaining: Number,
    sellerId: { type: String, default: "" },
      verified: { type: Boolean, default: false },
mobileNumber: { type: String, default: "" },
shopName: { type: String, default: "" },
    brandName: { type: String, default: "" },
    brandImg: { type: String, default: "" }, 
    categoryImg: { type: String, default: "" }, 
    subcategoryImg: { type: String, default: "" }, 
    productwiseDiscount: {
  type: Number,
  default: 0,
},
    childcategoryImg: { type: String, default: "" }, 
    save: String,
    type: { type: String, default: "" },     
     bulletPoints: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 4;
        },
        message: "Maximum 4 bullet points allowed",
      },
    },
    // ✅ Promo fields
 // ✅ Promo fields
 // ✅ Add startDate and endDate for promo
 
promoCode: { type: String, default: null },
promoType: { type: String, default: null },
promoValue: { type: Number, default: 0 },
promoStartDate: { type: Date, default: null },
promoEndDate: { type: Date, default: null },
 uploadstatus: {
      type: String,
      default: "pending", // pending, paid, delivered, etc
    },

allProductPromoCode: { type: String, default: null },
allProductPromoType: { type: String, default: null },
allProductPromoValue: { type: Number, default: 0 },
allProductPromoStartDate: { type: Date, default: null },
allProductPromoEndDate: { type: Date, default: null },
   size: {
  type: [String],
  default: [],
},        
   color: {
      type: [String], // now it's an array
      default: [], // starts empty
    },          
    variant: { type: String, default: "" },         
    stock: { type: Number, default: 0 },
    description: { type: String, default: "" },
    availability: { type: String, default: "" },
    metadescription: { type: String, default: "" },
    
    // changed from single string to array
    images: [String],
     imagesHash: { type: [String], default: [] },

    reviews: [reviewSchema],
    campaignId: { type: String, default: "" },
    campaignName: { type: String, default: "" },
    campaignImg: { type: String, default: "" },
   


  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);