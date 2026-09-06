const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");
const PendingRegistration = require("../models/PendingRegistration");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const { verifyCustomer } = require("../middleware/auth");
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);
const transporter = require("../config/mailer");
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many login attempts. Please try again after 15 minutes.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many password reset requests. Please try again later.",
  },
});

const verifyResetCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many verification attempts. Please request a new code later.",
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many password reset attempts. Please try again later.",
  },
});

/* =========================================================
   PASSWORD RESET HELPERS
   ========================================================= */

function generateResetCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashResetCode(code) {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
}

function isValidPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    !/\s/.test(password)
  );
}
function signToken(user) {
  return jwt.sign({ id: user._id, role: "customer" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

/* =========================================================
   FORGOT PASSWORD — REQUEST RESET CODE
   ========================================================= */

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  [
    body("email")
      .isString()
      .withMessage("Email is required.")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    try {
      const email = req.body.email;

      /*
       * Do not reveal whether an account exists.
       * This prevents account enumeration.
       */
      const genericMessage =
        "If an account exists with this email, a verification code has been sent.";

      const user = await User.findOne({ email }).select(
        "+resetCodeHash +resetCodeExpires +resetCodeAttempts"
      );

      if (!user) {
        return res.json({
          message: genericMessage,
        });
      }

      /* ---------- Generate secure 6-digit code ---------- */

      const resetCode = generateResetCode();

      /* ---------- Store only the hash ---------- */

      user.resetCodeHash = hashResetCode(resetCode);

      /* ---------- Code expires in 10 minutes ---------- */

      user.resetCodeExpires = new Date(
        Date.now() + 10 * 60 * 1000
      );

      /* ---------- Reset verification attempts ---------- */

      user.resetCodeAttempts = 0;

      await user.save();

      /* ---------- Send email ---------- */

      await transporter.sendMail({
        from: `"Husna Artistry" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your Husna Artistry Password Reset Code",
        text: `Your Husna Artistry password reset code is ${resetCode}. This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #333;">
            
            <h2 style="margin-bottom: 10px;">
              Husna Artistry
            </h2>

            <p>
              We received a request to reset your password.
            </p>

            <p>
              Your password reset verification code is:
            </p>

            <div style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              margin: 25px 0;
            ">
              ${resetCode}
            </div>

            <p>
              This code will expire in <strong>10 minutes</strong>.
            </p>

            <p>
              If you did not request a password reset, you can safely
              ignore this email.
            </p>

            <p style="margin-top: 30px;">
              — Husna Artistry
            </p>

          </div>
        `,
      });

      return res.json({
        message: genericMessage,
      });
    } catch (err) {
      console.error("Forgot password error:", err);

      /*
       * Don't expose email-provider, database, or server
       * implementation details to the customer.
       */
      return res.status(500).json({
        message:
          "Unable to process the password reset request. Please try again later.",
      });
    }
  }
);

/* =========================================================
   VERIFY PASSWORD RESET CODE
   ========================================================= */

router.post(
  "/verify-reset-code",
  verifyResetCodeLimiter,
  [
    body("email")
      .isString()
      .withMessage("Email is required.")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),

    body("code")
      .isString()
      .withMessage("Verification code is required.")
      .trim()
      .matches(/^\d{6}$/)
      .withMessage("Verification code must be 6 digits."),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    try {
      const { email, code } = req.body;

      const user = await User.findOne({ email }).select(
        "+resetCodeHash +resetCodeExpires +resetCodeAttempts"
      );

      /*
       * Use a generic response so we don't reveal
       * whether the account exists.
       */
      if (!user || !user.resetCodeHash || !user.resetCodeExpires) {
        return res.status(400).json({
          message: "Invalid or expired verification code.",
        });
      }

      /* ---------- Check expiry ---------- */

      if (user.resetCodeExpires.getTime() < Date.now()) {
        user.resetCodeHash = null;
        user.resetCodeExpires = null;
        user.resetCodeAttempts = 0;

        await user.save();

        return res.status(400).json({
          message: "This verification code has expired. Please request a new one.",
        });
      }

      /* ---------- Limit incorrect attempts ---------- */

      if (user.resetCodeAttempts >= 5) {
        user.resetCodeHash = null;
        user.resetCodeExpires = null;
        user.resetCodeAttempts = 0;

        await user.save();

        return res.status(429).json({
          message:
            "Too many incorrect attempts. Please request a new verification code.",
        });
      }

      /* ---------- Hash submitted code ---------- */

      const submittedCodeHash = hashResetCode(code);

      /* ---------- Compare hashes ---------- */

      if (submittedCodeHash !== user.resetCodeHash) {
        user.resetCodeAttempts += 1;

        await user.save();

        return res.status(400).json({
          message: "Invalid or expired verification code.",
        });
      }

      /* ---------- Code is valid ---------- */

      return res.json({
        message: "Verification code accepted.",
      });
    } catch (err) {
      console.error("Verify reset code error:", err);

      return res.status(500).json({
        message:
          "Unable to verify the code. Please try again later.",
      });
    }
  }
);

/* =========================================================
   RESET PASSWORD
   ========================================================= */

router.post(
  "/reset-password",
  resetPasswordLimiter,
  [
    body("email")
      .isString()
      .withMessage("Email is required.")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),

    body("code")
      .isString()
      .withMessage("Verification code is required.")
      .trim()
      .matches(/^\d{6}$/)
      .withMessage("Verification code must be 6 digits."),

    body("newPassword")
      .isString()
      .withMessage("New password is required.")
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters.")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter.")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter.")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number.")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Password must contain at least one special character.")
      .custom((value) => !/\s/.test(value))
      .withMessage("Password cannot contain spaces."),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    try {
      const { email, code, newPassword } = req.body;

      const user = await User.findOne({ email }).select(
        "+resetCodeHash +resetCodeExpires +resetCodeAttempts"
      );

      if (!user || !user.resetCodeHash || !user.resetCodeExpires) {
        return res.status(400).json({
          message: "Invalid or expired verification code.",
        });
      }

      /* ---------- Check expiry ---------- */

      if (user.resetCodeExpires.getTime() < Date.now()) {
        user.resetCodeHash = null;
        user.resetCodeExpires = null;
        user.resetCodeAttempts = 0;

        await user.save();

        return res.status(400).json({
          message:
            "This verification code has expired. Please request a new one.",
        });
      }

      /* ---------- Check attempt limit ---------- */

      if (user.resetCodeAttempts >= 5) {
        user.resetCodeHash = null;
        user.resetCodeExpires = null;
        user.resetCodeAttempts = 0;

        await user.save();

        return res.status(429).json({
          message:
            "Too many incorrect attempts. Please request a new verification code.",
        });
      }

      /* ---------- Verify code ---------- */

      const submittedCodeHash = hashResetCode(code);

      if (submittedCodeHash !== user.resetCodeHash) {
        user.resetCodeAttempts += 1;

        await user.save();

        return res.status(400).json({
          message: "Invalid or expired verification code.",
        });
      }

      /* ---------- Extra password validation ---------- */

      if (!isValidPassword(newPassword)) {
        return res.status(400).json({
          message:
            "Password must be 8-128 characters and contain uppercase, lowercase, number, and special character with no spaces.",
        });
      }

      /* ---------- Hash new password ---------- */

      user.passwordHash = await bcrypt.hash(newPassword, 12);

      /* ---------- Destroy reset credentials ---------- */

      user.resetCodeHash = null;
      user.resetCodeExpires = null;
      user.resetCodeAttempts = 0;
      user.resetCodeRequestedAt = null;

      await user.save();

      return res.json({
        message:
          "Password reset successfully. You can now log in with your new password.",
      });
    } catch (err) {
      console.error("Reset password error:", err);

      return res.status(500).json({
        message:
          "Unable to reset your password. Please try again later.",
      });
    }
  }
);

/* =========================================================
   CUSTOMER REGISTRATION — START EMAIL VERIFICATION
   ========================================================= */

router.post(
  "/register",
  [
    body("name")
      .isString()
      .withMessage("Name is required.")
      .trim()
      .notEmpty()
      .withMessage("Name is required."),

    body("email")
      .isString()
      .withMessage("Email is required.")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    try {
      const { name, email } = req.body;

      /* ---------- Check if account already exists ---------- */

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          message:
            "An account with this email already exists. Please log in instead.",
        });
      }

      /* ---------- Generate verification code ---------- */

      const verificationCode = generateResetCode();

      const verificationCodeHash =
        hashResetCode(verificationCode);

      /* ---------- Remove previous pending registration ---------- */

      await PendingRegistration.deleteOne({ email });

      /* ---------- Create pending registration ---------- */

      await PendingRegistration.create({
        name,
        email,
        verificationCodeHash,
        verificationExpires:
          new Date(Date.now() + 10 * 60 * 1000),
        verificationAttempts: 0,
      });

      /* ---------- Send verification email ---------- */

      try {
        await transporter.sendMail({
          from: `"Husna Artistry" <${process.env.EMAIL_USER}>`,

          to: email,

          subject:
            "Verify your Husna Artistry account",

          text:
            `Your Husna Artistry verification code is ${verificationCode}. ` +
            `This code will expire in 10 minutes.`,

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: auto;
              padding: 30px;
              color: #333;
            ">

              <h2>
                Husna Artistry
              </h2>

              <p>
                Hello ${name},
              </p>

              <p>
                Thank you for creating an account with
                Husna Artistry.
              </p>

              <p>
                Your email verification code is:
              </p>

              <div style="
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                margin: 25px 0;
              ">
                ${verificationCode}
              </div>

              <p>
                This code will expire in
                <strong>10 minutes</strong>.
              </p>

              <p>
                If you did not start this registration,
                you can safely ignore this email.
              </p>

              <p style="margin-top: 30px;">
                — Husna Artistry
              </p>

            </div>
          `,
        });

      } catch (emailError) {
        console.error(
          "Registration email error:",
          emailError
        );

        await PendingRegistration.deleteOne({
          email,
        });

        return res.status(500).json({
          message:
            "We could not send the verification email. Please try again.",
        });
      }

      return res.status(201).json({
        message:
          "Verification code sent. Please check your email.",
        email,
        requiresVerification: true,
      });

    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      return res.status(500).json({
        message:
          "Registration failed. Please try again.",
      });
    }
  }
);

/* =========================================================
   VERIFY CUSTOMER EMAIL
   ========================================================= */

router.post(
  "/verify-email",
  [
    body("email")
      .isString()
      .withMessage("Email is required.")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),

    body("code")
      .isString()
      .withMessage("Verification code is required.")
      .trim()
      .matches(/^\d{6}$/)
      .withMessage("Verification code must be 6 digits."),
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    try {
      const { email, code } = req.body;

      /* ---------- Find pending registration ---------- */

      const pending = await PendingRegistration.findOne({
        email,
      }).select(
        "+verificationCodeHash"
      );

      if (!pending) {
        return res.status(400).json({
          message:
            "Registration not found or verification has expired. Please register again.",
        });
      }

      /* ---------- Check OTP expiry ---------- */

      if (
        pending.verificationExpires.getTime() <
        Date.now()
      ) {
        await PendingRegistration.deleteOne({
          _id: pending._id,
        });

        return res.status(400).json({
          message:
            "This verification code has expired. Please register again.",
        });
      }

      /* ---------- Check attempts ---------- */

      if (
        pending.verificationAttempts >= 5
      ) {
        await PendingRegistration.deleteOne({
          _id: pending._id,
        });

        return res.status(429).json({
          message:
            "Too many incorrect attempts. Please register again.",
        });
      }

      /* ---------- Hash submitted OTP ---------- */

      const submittedCodeHash =
        hashResetCode(code);

      /* ---------- Compare OTP ---------- */

      if (
        submittedCodeHash !==
        pending.verificationCodeHash
      ) {
        pending.verificationAttempts += 1;

        await pending.save();

        return res.status(400).json({
          message:
            "Invalid or expired verification code.",
        });
      }

      /* ---------- OTP verified ---------- */

      /*
       * Do NOT create the User yet.
       *
       * We only confirm that the user controls
       * this email address.
       */
      pending.emailVerified = true;
pending.verifiedAt = new Date();

await pending.save();

      return res.json({
        message:
          "Email verified successfully. Please create your password.",
        email: pending.email,
        name: pending.name,
        emailVerified: true,
        registrationVerified: true,
      });

    } catch (err) {
      console.error(
        "Email verification error:",
        err
      );

      return res.status(500).json({
        message:
          "Unable to verify your email. Please try again later.",
      });
    }
  }
);
/* =========================================================
   COMPLETE CUSTOMER REGISTRATION
   ========================================================= */

router.post(
  "/complete-registration",
  [
    body("email")
      .isString()
      .withMessage("Email is required.")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),

    body("password")
      .isString()
      .withMessage("Password is required."),
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    try {
      const { email, password } = req.body;

      /* ---------- Validate password ---------- */

      if (!isValidPassword(password)) {
        return res.status(400).json({
          message:
            "Password must be 8-128 characters and contain uppercase, lowercase, number, and special character. Spaces are not allowed.",
        });
      }

      /* ---------- Find verified registration ---------- */

      const pending =
        await PendingRegistration.findOne({
          email,
          emailVerified: true,
        });

      if (!pending) {
        return res.status(400).json({
          message:
            "Please verify your email before creating your account.",
        });
      }

      /* ---------- Prevent duplicate account ---------- */

      const existingUser =
        await User.findOne({ email });

      if (existingUser) {
        await PendingRegistration.deleteOne({
          _id: pending._id,
        });

        return res.status(409).json({
          message:
            "An account with this email already exists. Please log in instead.",
        });
      }

      /* ---------- Hash password ---------- */

      const passwordHash =
        await bcrypt.hash(password, 12);

      /* ---------- Create actual customer ---------- */

      const user = await User.create({
        name: pending.name,
        email: pending.email,
        passwordHash,
        emailVerified: true,
        authProvider: "local",
      });

      /* ---------- Remove temporary registration ---------- */

      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      /* ---------- Create login token ---------- */

      const token = signToken(user);

      return res.status(201).json({
        message:
          "Account created successfully.",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });

    } catch (err) {
      console.error(
        "Complete registration error:",
        err
      );

      return res.status(500).json({
        message:
          "Unable to create your account. Please try again.",
      });
    }
  }
);

/* =========================================================
   RESEND CUSTOMER EMAIL VERIFICATION CODE
   ========================================================= */

router.post(
  "/resend-verification",
  [
    body("email")
      .isString()
      .withMessage("Email is required.")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
      });
    }

    try {
      const email = req.body.email;

      const pending =
        await PendingRegistration.findOne({
          email,
        });

      if (!pending) {
        return res.status(404).json({
          message:
            "Registration not found. Please start registration again.",
        });
      }

      if (pending.emailVerified) {
        return res.status(400).json({
          message:
            "This email has already been verified. Please create your password.",
        });
      }

      const verificationCode =
        generateResetCode();

      pending.verificationCodeHash =
        hashResetCode(verificationCode);

      pending.verificationExpires =
        new Date(
          Date.now() + 10 * 60 * 1000
        );

      pending.verificationAttempts = 0;

      await pending.save();

      try {
        await transporter.sendMail({
          from:
            `"Husna Artistry" <${process.env.EMAIL_USER}>`,

          to: pending.email,

          subject:
            "Your new Husna Artistry verification code",

          text:
            `Your Husna Artistry verification code is ${verificationCode}. ` +
            `This code will expire in 10 minutes.`,

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: auto;
              padding: 30px;
              color: #333;
            ">

              <h2>
                Husna Artistry
              </h2>

              <p>
                Hello ${pending.name},
              </p>

              <p>
                Here is your new email verification code:
              </p>

              <div style="
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                margin: 25px 0;
              ">
                ${verificationCode}
              </div>

              <p>
                This code will expire in
                <strong>10 minutes</strong>.
              </p>

              <p>
                If you did not request this code,
                you can safely ignore this email.
              </p>

              <p style="margin-top: 30px;">
                — Husna Artistry
              </p>

            </div>
          `,
        });

      } catch (emailError) {
        console.error(
          "Resend verification email error:",
          emailError
        );

        return res.status(500).json({
          message:
            "We could not send the verification email. Please try again.",
        });
      }

      return res.json({
        message:
          "A new verification code has been sent to your email.",
      });

    } catch (err) {
      console.error(
        "Resend verification error:",
        err
      );

      return res.status(500).json({
        message:
          "Unable to resend the verification code. Please try again.",
      });
    }
  }
);
/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

router.post(
  "/google",
  loginLimiter,
  async (req, res) => {
    try {
      const { credential } = req.body;

      if (!credential || typeof credential !== "string") {
        return res.status(400).json({
          message: "Google credential is required.",
        });
      }

      /* ---------- Verify Google ID token ---------- */

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        return res.status(401).json({
          message: "Invalid Google account.",
        });
      }

      const {
        sub: googleId,
        email,
        name,
        email_verified: emailVerified,
      } = payload;

      if (!googleId || !email || !emailVerified) {
        return res.status(401).json({
          message: "Google account verification failed.",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      /* ---------- Check Google account first ---------- */

      let user = await User.findOne({ googleId });

      if (user) {
        if (user.isBlocked) {
          return res.status(403).json({
            message:
              "This account has been blocked. Please contact us.",
          });
        }

        const token = signToken(user);

        return res.json({
          token,
          user: {
            name: user.name,
            email: user.email,
          },
        });
      }

      /* ---------- Check existing email account ---------- */

      user = await User.findOne({
        email: normalizedEmail,
      });

      if (user) {
        if (user.isBlocked) {
          return res.status(403).json({
            message:
              "This account has been blocked. Please contact us.",
          });
        }

        /*
         * Google has verified ownership of this email.
         * Link Google login to the existing account.
         */
        user.googleId = googleId;

        await user.save();

        const token = signToken(user);

        return res.json({
          token,
          user: {
            name: user.name,
            email: user.email,
          },
        });
      }

      /* ---------- Create new Google account ---------- */

      user = await User.create({
        name: name || "Google User",
        email: normalizedEmail,
        googleId,
        authProvider: "google",
        passwordHash: null,
      });

      const token = signToken(user);

      return res.status(201).json({
        token,
        user: {
          name: user.name,
          email: user.email,
        },
      });
    } catch (err) {
      console.error("Google login error:", err);

      return res.status(401).json({
        message: "Google sign-in failed. Please try again.",
      });
    }
  }
);

router.post(
  "/login",
  loginLimiter,
  [
    body("email")
  .isString()
  .withMessage("Email is required.")
  .trim()
  .isEmail()
  .withMessage("Please enter a valid email address.")
  .normalizeEmail(),
   body("password")
  .isString()
  .withMessage("Password is required.")
  .notEmpty()
  .withMessage("Password is required.")
  .isLength({ max: 128 })
  .withMessage("Invalid email or password."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      const { email, password } = req.body;
    const user = await User.findOne({ email });

if (!user) {
  return res.status(401).json({
    message: "Incorrect email or password.",
  });
}

if (user.isBlocked) {
  return res.status(403).json({
    message:
      "This account has been blocked. Please contact us.",
  });
}

/* ---------- Email verification check ---------- */

/*
 * Existing accounts created before email verification
 * was introduced do not have emailVerified set.
 *
 * New local accounts explicitly have emailVerified = false.
 * Google accounts are already verified by Google.
 */

if (
  user.authProvider === "local" &&
  user.emailVerified === false
) {
  return res.status(403).json({
    message:
      "Please verify your email before logging in.",
    requiresVerification: true,
  });
}

const match = await bcrypt.compare(
  password,
  user.passwordHash
);

if (!match) {
  return res.status(401).json({
    message: "Incorrect email or password.",
  });
}
      if (!match) return res.status(401).json({ message: "Incorrect email or password." });

      const token = signToken(user);
      res.json({ token, user: { name: user.name, email: user.email } });
    } catch (err) {
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  }
);

router.get("/me", verifyCustomer, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "Account not found." });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Could not load account." });
  }
});

router.put(
  "/me",
  verifyCustomer,
  [
    body("name").optional().trim().notEmpty(),
    body("phone").optional().trim(),
  ],
  async (req, res) => {
    try {
      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.phone !== undefined) updates.phone = req.body.phone;
      const user = await User.findByIdAndUpdate(req.userId, updates, {
        new: true,
      }).select("-passwordHash");
      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: "Could not update profile." });
    }
  }
);

router.put(
  "/change-password",
  verifyCustomer,
  [
    body("currentPassword")
  .isString()
  .withMessage("Current password is required.")
  .notEmpty()
  .withMessage("Current password is required."),
    body("newPassword")
      .isString()
      .withMessage("New password is required.")
      .isLength({ min: 8, max: 128 })
      .withMessage("New password must be between 8 and 128 characters.")
      .matches(/[A-Z]/)
      .withMessage("New password must contain at least one uppercase letter.")
      .matches(/[a-z]/)
      .withMessage("New password must contain at least one lowercase letter.")
      .matches(/[0-9]/)
      .withMessage("New password must contain at least one number.")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("New password must contain at least one special character.")
      .custom((value) => !/\s/.test(value))
      .withMessage("New password cannot contain spaces."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "Account not found." });

      const match = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
      if (!match) return res.status(401).json({ message: "Current password is incorrect." });

      user.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
      await user.save();
      res.json({ message: "Password updated successfully." });
    } catch (err) {
      res.status(500).json({ message: "Could not change password." });
    }
  }
);

// Address book
router.post("/addresses", verifyCustomer, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Account not found." });
    user.addresses.push(req.body);
    await user.save();
    res.status(201).json({ addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: "Could not save address." });
  }
});

router.delete("/addresses/:addressId", verifyCustomer, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Account not found." });
    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== req.params.addressId
    );
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: "Could not remove address." });
  }
});

module.exports = router;
