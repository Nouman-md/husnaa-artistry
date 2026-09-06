const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
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

    verificationCodeHash: {
      type: String,
      required: true,
      select: false,
    },

    verificationExpires: {
      type: Date,
      required: true,
    },

    verificationAttempts: {
      type: Number,
      default: 0,
    },
   emailVerified: {
  type: Boolean,
  default: false,
},

verifiedAt: {
  type: Date,
  default: null,
}, 
  },
  {
    timestamps: true,
  }
);

/*
 * Automatically remove incomplete registrations
 * after 30 minutes.
 */
pendingRegistrationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 1800 }
);

module.exports = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema
);