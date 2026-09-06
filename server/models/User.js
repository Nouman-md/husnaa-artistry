const mongoose = require("mongoose");

/* =========================================================
   ADDRESS SCHEMA
   ========================================================= */

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: "Home",
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    houseNo: {
      type: String,
      required: true,
      trim: true,
    },

    street: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      trim: true,
      default: "",
    },

    landmark: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    addressType: {
      type: String,
      enum: ["Home", "Work"],
      default: "Home",
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   USER SCHEMA
   ========================================================= */

const userSchema = new mongoose.Schema(
  {
    /* ---------- BASIC USER INFORMATION ---------- */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    /* ---------- PASSWORD ---------- */

    passwordHash: {
  type: String,
  default: null,
},

/* ---------- GOOGLE AUTHENTICATION ---------- */

googleId: {
  type: String,
  unique: true,
  sparse: true,
},

authProvider: {
  type: String,
  enum: ["local", "google"],
  default: "local",
},

    /* =====================================================
       PASSWORD RESET
       ===================================================== */

    resetCodeHash: {
      type: String,
      default: null,
      select: false,
    },

    resetCodeExpires: {
      type: Date,
      default: null,
      select: false,
    },

    resetCodeAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    resetCodeRequestedAt: {
      type: Date,
      default: null,
      select: false,
    },

    /* ---------- ADDRESS BOOK ---------- */

    addresses: {
      type: [addressSchema],
      default: [],
    },

    /* ---------- ACCOUNT STATUS ---------- */

isBlocked: {
  type: Boolean,
  default: false,
},

/* ---------- EMAIL VERIFICATION ---------- */

emailVerified: {
  type: Boolean,
  default: false,
},

emailVerificationCodeHash: {
  type: String,
  default: null,
  select: false,
},

emailVerificationExpires: {
  type: Date,
  default: null,
  select: false,
},

emailVerificationAttempts: {
  type: Number,
  default: 0,
  select: false,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);