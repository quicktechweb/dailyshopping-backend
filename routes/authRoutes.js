import express from "express";
import axios from "axios";
import UserData from "../models/User.js";   // 👈 সঠিক model import
import { saveOtp, verifyOtp } from "../utils/otpStore.js";
import { nanoid } from "nanoid";
import BadgeLevel from "../models/BadgeLevel.js";
import bcrypt from "bcryptjs";

const router = express.Router();


const BULKSMSBD_API_KEY = "TJiwADvi0MYQRHnn0vh8";
const SENDER_ID = "8809617611038";



const RTCOM_ACODE = "30000668";
const RTCOM_API_KEY ="420a7f5a9014ee0a053d92a87f5ea6f632c6290a";
const RTCOM_SENDER_ID = "8809648906949";

async function sendSmsViaRtcom(phoneNumber, message) {
  const formattedPhone = `+88${phoneNumber}`;

  const response = await axios.post("https://api.rtcom.xyz/onetomany", {
    acode: RTCOM_ACODE,
    api_key: RTCOM_API_KEY,
    senderid: RTCOM_SENDER_ID,
    type: "text",
    msg: message,
    contacts: formattedPhone,
    transactionType: "T", // Transactional, since it's OTP
    contentID: ""
  });

  return response.data;
}

router.post("/send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!/^\d{11}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: "Invalid phone number" });
  }

  const existingUser = await UserData.findOne({ phoneNumber });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Phone number already registered" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  saveOtp(phoneNumber, otp);

  try {
    const message = `Your OTP is: ${otp}`;
    const data = await sendSmsViaRtcom(phoneNumber, message);

    if (data?.response?.code === 200) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ success: false, message: "Failed to send SMS" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error sending OTP" });
  }
});


router.post("/send-otp-data", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!/^\d{11}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: "Invalid phone number" });
  }

  const existingUser = await UserData.findOne({ phoneNumber });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Phone number already registered" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  saveOtp(phoneNumber, otp);

  try {
    const message = `Your OTP is: ${otp}`;
    const data = await sendSmsViaRtcom(phoneNumber, message);

    if (data?.response?.code === 200) {
      return res.json({
        success: true,
        phoneNumber,
        otp,
        message: "OTP sent successfully"
      });
    } else {
      return res.status(500).json({ success: false, message: "Failed to send SMS" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error sending OTP" });
  }
});

// ✅ Verify OTP
router.post("/verify-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (verifyOtp(phoneNumber, otp)) {
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, message: "Invalid OTP" });
});

// ✅ Send OTP
// router.post("/send-otp", async (req, res) => {
//   const { phoneNumber } = req.body;

//   if (!/^\d{11}$/.test(phoneNumber)) {
//     return res.status(400).json({ success: false, message: "Invalid phone number" });
//   }

//   // Check if number already registered
//   const existingUser = await UserData.findOne({ phoneNumber });
//   if (existingUser) {
//     return res.status(400).json({ success: false, message: "Phone number already registered" });
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   saveOtp(phoneNumber, otp);

//   try {
//     const formattedPhone = `88${phoneNumber}`;
//     const message = encodeURIComponent(`Your OTP is: ${otp}`);

//     const response = await axios.get(
//       `http://bulksmsbd.net/api/smsapi?api_key=${BULKSMSBD_API_KEY}&number=${formattedPhone}&message=${message}&type=text&senderid=${SENDER_ID}`
//     );

//     if (response.data.response_code === 1000 || response.data.response_code === 202) {
//       res.json({ success: true });
//     } else {
//       res.status(500).json({ success: false, message: "Failed to send SMS" });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Error sending OTP" });
//   }
// });


// router.post("/send-otp-data", async (req, res) => {
//   const { phoneNumber } = req.body;

//   if (!/^\d{11}$/.test(phoneNumber)) {
//     return res.status(400).json({ success: false, message: "Invalid phone number" });
//   }

//   // Check if number already registered
//   const existingUser = await UserData.findOne({ phoneNumber });
//   if (existingUser) {
//     return res.status(400).json({ success: false, message: "Phone number already registered" });
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   saveOtp(phoneNumber, otp);

//   try {
//     const formattedPhone = `88${phoneNumber}`;
//     const message = encodeURIComponent(`Your OTP is: ${otp}`);

//     const response = await axios.get(
//       `http://bulksmsbd.net/api/smsapi?api_key=${BULKSMSBD_API_KEY}&number=${formattedPhone}&message=${message}&type=text&senderid=${SENDER_ID}`
//     );

//     if (response.data.response_code === 1000 || response.data.response_code === 202) {
//       // ⭐⭐⭐ এখানে শুধু JSON response পরিবর্তন করেছি ⭐⭐⭐
//       return res.json({
//         success: true,
//         phoneNumber,
//         otp,
//         message: "OTP sent successfully"
//       });
//     } else {
//       return res.status(500).json({ success: false, message: "Failed to send SMS" });
//     }
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Error sending OTP" });
//   }
// });

// // ✅ Verify OTP
// router.post("/verify-otp", (req, res) => {
//   const { phoneNumber, otp } = req.body;

//   if (verifyOtp(phoneNumber, otp)) {
//     return res.json({ success: true });
//   }
//   res.status(400).json({ success: false, message: "Invalid OTP" });
// });

// ✅ Register User
 router.post("/register", async (req, res) => {
  const { phoneNumber, password, displayName, referralCode } = req.body;

  try {
    const existingUser = await UserData.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Phone already registered" });
    }

    const myrefferalcode = `REF-${nanoid(8).toUpperCase()}`;
     const hashedPassword = await bcrypt.hash(password, 12);
     const userId = `USR-${nanoid(10)}`;
    const newUser = new UserData({
      phoneNumber,
      password: hashedPassword,
      displayName,
      referralCode: referralCode || "",
      myrefferalcode,
        userId, 
    });

    await newUser.save();

    // ------------------------
    // Referral Bonus Logic
    // ------------------------
    if (referralCode) {
      const directReferrer = await UserData.findOne({ myrefferalcode: referralCode });
      if (directReferrer) {
        // Direct referral
        directReferrer.walletBalance += 5;
        directReferrer.referralBalance = (directReferrer.referralBalance || 0) + 5;
        directReferrer.referralCount = (directReferrer.referralCount || 0) + 1;

        // Save referral history
        directReferrer.referralHistory.push({
          type: "direct",
          amount: 5,
          referredUser: phoneNumber
        });

        // Dynamic badge assignment
        const badges = await BadgeLevel.find();
        const userCount = directReferrer.referralCount;
        const badge = badges.find(b => userCount >= b.minCount && userCount <= b.maxCount);
        directReferrer.badge = badge ? badge.name : "None";

        await directReferrer.save();

        // Indirect referral (2 taka to referrer of direct referrer)
        if (directReferrer.referralCode) {
          const indirectReferrer = await UserData.findOne({ myrefferalcode: directReferrer.referralCode });
          if (indirectReferrer) {
            indirectReferrer.walletBalance += 2;
            indirectReferrer.referralBalance = (indirectReferrer.referralBalance || 0) + 2;

            // Save indirect referral history
            indirectReferrer.referralHistory.push({
              type: "indirect",
              amount: 2,
              referredUser: phoneNumber
            });

            // Badge update for indirect referrer
            const indirectBadge = badges.find(b => indirectReferrer.referralCount >= b.minCount && indirectReferrer.referralCount <= b.maxCount);
            indirectReferrer.badge = indirectBadge ? indirectBadge.name : "None";

            await indirectReferrer.save();
          }
        }
      }
    }

    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        displayName: newUser.displayName,
         userId: newUser.userId, 
        phoneNumber: newUser.phoneNumber,
        newpartroles: newUser.newpartroles,
        newpartuser: newUser.newpartuser,
        myrefferalcode: newUser.myrefferalcode,
        referralCode: newUser.referralCode,
        permissions: newUser.permissions,
        walletBalance: newUser.walletBalance,
        status: newUser.status,
      }
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: err.message || "Error registering user" });
  }
});





// -------------------- LOGIN ------------------------
//  router.post("/login", async (req, res) => {
//   const { identifier, password } = req.body; // identifier = phone/email/uid

//   if (!identifier || !password) {
//     return res.status(400).json({ success: false, message: "Identifier & password required" });
//   }

//   try {
//     const user = await UserData.findOne({
//       $or: [
//         { phoneNumber: identifier },
//         { email: identifier },
//         { uid: identifier },
//       ],
//     });

//     if (!user) return res.status(400).json({ success: false, message: "User not registered" });
//     if (user.status === "blocked") return res.status(403).json({ success: false, message: "Your account is blocked" });
//     if (user.password !== password) return res.status(400).json({ success: false, message: "Incorrect password" });

//     return res.json({ success: true, user });
//   } catch (err) {
//     console.error("Login error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });

  router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await UserData.findOne({
      $or: [
        { phoneNumber: identifier },
        { email: identifier },
        { uid: identifier },
      ],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Account blocked",
      });
    }

    // ✅ Superadmin can't login using phone number
    const isSuperAdmin =
      String(user.newpartroles || "").toLowerCase() === "superadmin" ||
      String(user.newpartuser || "").toLowerCase() === "superadmin";

    // identifier email/uid er sathe na mile dhore newa hobe phone number diye
    // login korar chesta hocche
    const matchedByEmailOrUid =
      (user.email && identifier === user.email) ||
      (user.uid && identifier === user.uid);

    const isPhoneLogin = !matchedByEmailOrUid;

    if (isSuperAdmin && isPhoneLogin) {
      return res.status(403).json({
        success: false,
        message:
          "Login via phone number is not permitted for this account. Please use your registered email or UID to sign in.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
         userId: user.userId, 
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        newpartroles: user.newpartroles,   // ✅ role → newpartroles
        newpartuser: user.newpartuser,     // ✅ add kore dilam
        permissions: user.permissions,     // ✅ admin/subadmin menu-r jonno zoruri
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


 router.post("/admin-login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await UserData.findOne({
      $or: [
        { phoneNumber: identifier },
        { email: identifier },
        { uid: identifier },
        { displayName: identifier },
      ],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Account blocked",
      });
    }

    if (user.newpartroles !== "SUPERadmin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized as admin",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        newpartroles: user.newpartroles,   // ✅ role → newpartroles
        newpartuser: user.newpartuser,     // ✅ add
        permissions: user.permissions,     // ✅ add
      },
    });

  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});



// router.post("/login", async (req, res) => {
//   const { identifier, password } = req.body;

//   try {
//     const user = await UserData.findOne({
//       $or: [
//         { phoneNumber: identifier },
//         { email: identifier },
//         { uid: identifier },
//       ],
//     });

//     if (!user) return res.status(400).json({ success: false, message: "User not found" });
//     if (user.status === "blocked") return res.status(403).json({ success: false, message: "Account blocked" });

//     const isMatch = await user.comparePassword(password);

//     if (!isMatch) return res.status(400).json({ success: false, message: "Wrong password" });

//     // Sign tokens
//     const accessToken = signAccessToken(user);
// console.log("Access Token:", accessToken); // 🔹 Token console e dekha jabe

//     const refreshToken = signRefreshToken(user);

//     // Send cookies + user data
//     res
//       .cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 10*60*1000 })
//       .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 7*24*60*60*1000 })
//       .json({
//         success: true,
//         user: {
//           _id: user._id,
//           displayName: user.displayName,
//           phoneNumber: user.phoneNumber,
//           role: user.newpartroles,
//         },
//       });

//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
// ✅ Role API (by phone/email/uid)
router.get("/role", async (req, res) => {
  try {
    const { phoneNumber, email, uid } = req.query;

    if (!phoneNumber && !email && !uid) {
      return res.status(400).json({ success: false, message: "Provide phoneNumber or email or uid" });
    }

    const user = await UserData.findOne({
      $or: [
        phoneNumber ? { phoneNumber } : null,
        email ? { email } : null,
        uid ? { uid } : null,
      ].filter(Boolean),
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const role = (user.newpartroles || "").toString();

    const isAdmin = role.toLowerCase() === "admin";
    const isSubAdmin = role.toLowerCase() === "subadmin";
    const isSUPER = role.toLowerCase() === "superadmin";

    return res.json({
      success: true,
      role,
      admin: isAdmin,
      subadmin: isSubAdmin,
      SUPERadmin: isSUPER,
    });
  } catch (err) {
    console.error("Role check error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------- Google Authentication ------------------------

router.post("/users/get-wallet", async (req, res) => {
  try {
    const { auth } = req.body;

    if (!auth) {
      return res.json({ walletBalance: 0, message: "No auth provided" });
    }

    // Check phone or email dynamically
    const user = await UserData.findOne({
      $or: [
        { phoneNumber: auth },
        { email: auth }
      ]
    });

    if (!user) {
      return res.json({ walletBalance: 0, message: "User not found" });
    }

    return res.json({
      walletBalance: user.walletBalance,
      message: "Wallet balance fetched"
    });

  } catch (err) {
    console.error("Wallet fetch error:", err);
    return res.json({ walletBalance: 0, message: "Server error" });
  }
});


// Google Register
router.post("/google-register", async (req, res) => {
  try {
    const { displayName, email, uid } = req.body;

    if (!displayName || !email || !uid)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    // Check existing user
    let user = await UserData.findOne({ $or: [{ uid }, { email }] });

    if (user) {
      // Existing user → just login
      return res.json({ success: true, user, isNew: false });
    }

    // New user → generate referral code
    const myrefferalcode = `REF-${nanoid(8).toUpperCase()}`;

    user = new UserData({
      displayName,
      email,
      uid,
      myrefferalcode, // save generated referral code
      newpartuser: "user",
    });

    await user.save();

    return res.json({ success: true, user, isNew: true });

  } catch (err) {
    console.error("Google Register Error:", err);
    return res.status(500).json({ success: false, message: "Error registering user" });
  }
});





router.get("/me/:id", async (req, res) => {
  try {
    const user = await UserData.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// all user show 
router.get("/alluser", async (req, res) => {
  try {
    const users = await UserData.find({});
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.delete("/delete/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const user = await UserData.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await UserData.findByIdAndDelete(userId);
    res.json({ success: true, message: "Your account has been deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



router.get("/my-referrals/:referralCode", async (req, res) => {
  const { referralCode } = req.params;

  if (!referralCode) {
    return res.status(400).json({ success: false, message: "Referral code is required" });
  }

  try {
    // Find users whose referralCode matches the given code
    const myReferrals = await UserData.find({ referralCode });

    if (!myReferrals || myReferrals.length === 0) {
      return res.status(404).json({ success: false, message: "No referrals found" });
    }

    res.json({ success: true, users: myReferrals });
  } catch (err) {
    console.error("Failed to fetch referrals:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------- Block User ------------------------
router.patch("/blockuser/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const user = await UserData.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.status === "blocked") {
      return res.status(400).json({ success: false, message: "User already blocked" });
    }

    user.status = "blocked";
    await user.save();

    res.json({ success: true, message: "User blocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------- Unblock User ------------------------
router.patch("/unblockuser/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const user = await UserData.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.status === "active") {
      return res.status(400).json({ success: false, message: "User already active" });
    }

    user.status = "active";
    await user.save();

    res.json({ success: true, message: "User unblocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// -------------------- Update profile ------------------------
router.put("/update/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // only allow these fields
    const {
      displayName,
      birthday,
      gender,
      address,
      avatar,
    } = req.body;

    const updateFields = {
      displayName,
      birthday,
      gender,
      address,
      avatar,
    };

    // remove undefined fields
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const updatedUser = await UserData.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//  user role set 
// routes/userRoutes.js
// GET role by phone or email
router.get("/role", async (req, res) => {
  try {
    const { phoneNumber, email, uid } = req.query;

    if (!phoneNumber && !email && !uid) {
      return res.status(400).json({ success: false, message: "Provide phoneNumber or email or uid" });
    }

    const user = await UserData.findOne({
      $or: [
        phoneNumber ? { phoneNumber } : null,
        email ? { email } : null,
        uid ? { uid } : null,
      ].filter(Boolean),
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // আপনার DB এর role field যদি newpartroles হয়
    const role = (user.newpartroles || "").toString();

    const isAdmin = role.toLowerCase() === "admin" || role === "ADMIN";
    const isSubAdmin = role.toLowerCase() === "subadmin" || role === "SUBADMIN";
    const isSUPER = role.toLowerCase() === "superadmin" || role === "SUPERadmin" || role === "SUPERADMIN";

    return res.json({
      success: true,
      role,
      admin: isAdmin,
      subadmin: isSubAdmin,
      SUPERadmin: isSUPER,
    });
  } catch (err) {
    console.error("Role check error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

  
// permisson add features set 
 // ✅ Update User Role + Permissions
 // ✅ Update User Role + Permissions (MERGE version)
router.put("/update-user/:id", async (req, res) => {
  try {
    const { newpartroles, permissions } = req.body;

    // আগের ডেটা বের করো
    const user = await UserData.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // পুরানো permission object merge করে আপডেট করো
    const updatedPermissions = { ...user.permissions, ...permissions };

    user.newpartroles = newpartroles || user.newpartroles;
    user.permissions = updatedPermissions;

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: "User role and permissions updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// admin refferal 

router.get("/admin/referrals", async (req, res) => {
  try {
    const users = await UserData.find({});

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    const referralData = users.map(user => {
      // কারা এই user কে রেফার করেছে
      const referredUsers = users.filter(
        u => u.referralCode === user.myrefferalcode
      );

      return {
        userId: user._id,
        name: user.displayName || user.name,
        phone: user.phoneNumber,
        myReferralCode: user.myrefferalcode,
        totalReferrals: referredUsers.length, // কতজনকে রেফার করেছে
        referredUsers: referredUsers.map(r => ({
          name: r.displayName || r.name,
          phone: r.phoneNumber,
          joinedAt: r.createdAt,
        })),
      };
    });

    res.json({ success: true, referrals: referralData });
  } catch (err) {
    console.error("Failed to fetch referral history:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});






// localstorage refresh and update data 
router.get("/get-user/:id", async (req, res) => {
  try {
    const user = await UserData.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// active user login 
// -------------------- Active Users API ------------------------
router.get("/active-users", async (req, res) => {
  try {
    // ধরলাম: UserData collection-এ `status` ফিল্ড আছে (active / blocked)
    // অথবা তুমি চাইলে lastLogin / lastActivity দিয়েও ফিল্টার করতে পারো
    const activeUsers = await UserData.find({ status: "active" });

    if (!activeUsers || activeUsers.length === 0) {
      return res.status(404).json({ success: false, message: "No active users found" });
    }

    res.json({ success: true, users: activeUsers });
  } catch (err) {
    console.error("Active users fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// forget password 

// 1️⃣ Send OTP
// Send OTP for Forgot Password
router.post("/forgot-send-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!/^\d{11}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: "Invalid phone number" });
  }

  // Check if user exists
  const existingUser = await UserData.findOne({ phoneNumber });
  if (!existingUser) {
    return res.status(400).json({ success: false, message: "Phone number not registered" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  saveOtp(phoneNumber, otp);

  try {
    const message = `Your OTP is: ${otp}`;
    const data = await sendSmsViaRtcom(phoneNumber, message);

    if (data?.response?.code === 200) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ success: false, message: "Failed to send SMS" });
    }
  } catch (error) {
    console.error("Forgot Send OTP Error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Error sending OTP" });
  }
});


 router.post("/forgots-sends-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!/^\d{11}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: "Invalid phone number" });
  }

  const existingUser = await UserData.findOne({ phoneNumber });
  if (!existingUser) {
    return res.status(400).json({ success: false, message: "Phone number not registered" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  saveOtp(phoneNumber, otp);

  try {
    const message = `Your OTP is: ${otp}`;
    const data = await sendSmsViaRtcom(phoneNumber, message);

    if (data?.response?.code === 200) {
      return res.json({
        success: true,
        phoneNumber,
        otp,
        message: "OTP sent successfully"
      });
    } else {
      return res.status(500).json({ success: false, message: "Failed to send SMS" });
    }
  } catch (error) {
    console.error("Forgot Sends OTP Error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Error sending OTP" });
  }
});

// Verify OTP
router.post("/forgot-verify-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (verifyOtp(phoneNumber, otp)) { // your OTP verification logic
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, message: "Invalid OTP" });
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { phoneNumber, newPassword } = req.body;

  try {
    const user = await UserData.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    user.password = newPassword; // optionally hash the password
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ✅ BLOCK USER
router.patch("/blockuser/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    const user = await UserData.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check wallet balance
    if (user.walletBalance > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot block this user. User has ৳${user.walletBalance} in wallet.`
      });
    }

    // Optional: Add reason (frontend can send a reason)
    const reason = req.body.reason || "Blocked by admin";

    user.status = "blocked";
    user.blockReason = reason; // নতুন ফিল্ড block reason
    await user.save();

    return res.json({ success: true, message: "User blocked successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ UNBLOCK USER
router.patch("/unblockuser/:phoneNumber", async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    const user = await UserData.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = "active";
    user.blockReason = null; // clear reason
    await user.save();

    return res.json({ success: true, message: "User unblocked successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


// user profile part set 
// -------------------- Get Profile By UserId ------------------------
 // -------------------- Get Profile By UserId ------------------------
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserData.findOne({ userId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        userId: user.userId,
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        birthday: user.birthday,
        gender: user.gender,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------- Update Profile By UserId ------------------------
router.put("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, birthday, gender, avatar } = req.body;

    const updateFields = { displayName, birthday, gender, avatar };
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const updatedUser = await UserData.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        userId: updatedUser.userId,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        birthday: updatedUser.birthday,
        gender: updatedUser.gender,
        avatar: updatedUser.avatar,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});


// -------------------- ADDRESS BOOK (embedded in UserData) ------------------------

// ✅ Get all addresses of a user
router.get("/addresses/:userId", async (req, res) => {
  try {
    const user = await UserData.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, addresses: user.addresses || [] });
  } catch (err) {
    console.error("Fetch addresses error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get single address (by userId + addressId)
router.get("/addresses/:userId/:addressId", async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const user = await UserData.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.json({ success: true, address: addr });
  } catch (err) {
    console.error("Fetch address error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Add new address
router.post("/addresses/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, landmark, province, city, zone, address, label } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, message: "Name, phone and address are required" });
    }

    const user = await UserData.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.addresses.push({ name, phone, landmark, province, city, zone, address, label });
    await user.save();

    res.json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    console.error("Add address error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// ✅ Update address
router.put("/addresses/:userId/:addressId", async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const { name, phone, landmark, province, city, zone, address, label } = req.body;

    const user = await UserData.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (name !== undefined) addr.name = name;
    if (phone !== undefined) addr.phone = phone;
    if (landmark !== undefined) addr.landmark = landmark;
    if (province !== undefined) addr.province = province;
    if (city !== undefined) addr.city = city;
    if (zone !== undefined) addr.zone = zone;
    if (address !== undefined) addr.address = address;
    if (label !== undefined) addr.label = label;

    await user.save();

    res.json({ success: true, message: "Address updated successfully", address: addr });
  } catch (err) {
    console.error("Update address error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// ✅ Delete address
router.delete("/addresses/:userId/:addressId", async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await UserData.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    addr.deleteOne();
    await user.save();

    res.json({ success: true, message: "Address deleted successfully", addresses: user.addresses });
  } catch (err) {
    console.error("Delete address error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Set default shipping address
router.patch("/addresses/:userId/:addressId/default-shipping", async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await UserData.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    user.addresses.forEach((a) => (a.isDefaultShipping = false));
    addr.isDefaultShipping = true;

    await user.save();
    res.json({ success: true, message: "Default shipping address set", addresses: user.addresses });
  } catch (err) {
    console.error("Set default shipping error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Set default billing address
router.patch("/addresses/:userId/:addressId/default-billing", async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await UserData.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    user.addresses.forEach((a) => (a.isDefaultBilling = false));
    addr.isDefaultBilling = true;

    await user.save();
    res.json({ success: true, message: "Default billing address set", addresses: user.addresses });
  } catch (err) {
    console.error("Set default billing error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// payment sytem  
// -------------------- PAYMENT METHODS (embedded in UserData) ------------------------

// ✅ Get all payment methods of a user
router.get("/payments/:userId", async (req, res) => {
  try {
    const user = await UserData.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, paymentMethods: user.paymentMethods || [] });
  } catch (err) {
    console.error("Fetch payment methods error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Add new card
router.post("/payments/:userId/card", async (req, res) => {
  try {
    const { userId } = req.params;
    const { cardNumber, expiryDate, cardBrand } = req.body;

    if (!cardNumber || !expiryDate) {
      return res.status(400).json({ success: false, message: "Card number and expiry date required" });
    }

    const user = await UserData.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.paymentMethods.push({
      type: "card",
      cardNumber,
      expiryDate,
      cardBrand: cardBrand || "visa",
    });

    await user.save();

    res.json({
      success: true,
      message: "Card added successfully",
      paymentMethods: user.paymentMethods,
    });
  } catch (err) {
    console.error("Add card error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// ✅ Add new wallet
router.post("/payments/:userId/wallet", async (req, res) => {
  try {
    const { userId } = req.params;
    const { walletProvider, walletNumber } = req.body;

    if (!walletProvider || !walletNumber) {
      return res.status(400).json({ success: false, message: "Wallet provider and number required" });
    }

    const user = await UserData.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.paymentMethods.push({
      type: "wallet",
      walletProvider,
      walletNumber,
    });

    await user.save();

    res.json({
      success: true,
      message: "Wallet added successfully",
      paymentMethods: user.paymentMethods,
    });
  } catch (err) {
    console.error("Add wallet error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// ✅ Delete payment method
router.delete("/payments/:userId/:paymentId", async (req, res) => {
  try {
    const { userId, paymentId } = req.params;

    const user = await UserData.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const payment = user.paymentMethods.id(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    payment.deleteOne();
    await user.save();

    res.json({
      success: true,
      message: "Payment method deleted successfully",
      paymentMethods: user.paymentMethods,
    });
  } catch (err) {
    console.error("Delete payment method error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// 3️⃣ Reset Password





export default router;