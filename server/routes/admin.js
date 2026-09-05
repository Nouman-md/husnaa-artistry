const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit"); 
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const User = require("../models/User");
const upload = require("../middleware/upload");
const { verifyAdmin } = require("../middleware/auth");

// Slow down brute-force attempts against the admin login specifically.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

router.post("/login", adminLoginLimiter, async (req, res) => {
  const { name, password } = req.body;

  if (name === process.env.ADMIN_NAME) {
      const passwordMatch = await bcrypt.compare(
          password,
          process.env.ADMIN_PASSWORD
      );

      if (passwordMatch) {
          const token = jwt.sign(
              { role: "admin" },
              process.env.ADMIN_JWT_SECRET,
              { expiresIn: "12h" }
          );

          return res.json({ token });
      }
  }

  res.status(401).json({ message: "Incorrect admin name or password." });
});

// Everything below requires a valid admin session.
router.use(verifyAdmin);
/* ---------------- PRODUCTS ---------------- */

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Could not load products." });
  }
});


/* ---------- CREATE PRODUCT ---------- */

router.post(
  "/products",
  upload.array("images", 6),
  async (req, res) => {
    try {
     
    const {
  name,
  category,
  originalPrice,
  offerPrice,
  saleActive,
  description,
  frameColor,
  stockStatus,
} = req.body;

      const sizes = (req.body.sizes || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const cleanName = typeof name === "string" ? name.trim() : "";
      const cleanCategory =
        typeof category === "string" ? category.trim() : "";
      const cleanDescription =
        typeof description === "string" ? description.trim() : "";
      const cleanFrameColor =
        typeof frameColor === "string" ? frameColor.trim() : "";

const numericOriginalPrice = Number(originalPrice);
const numericOfferPrice = Number(offerPrice);
const isSaleActive = saleActive === "true";
      /* ---------- VALIDATION ---------- */

      if (!cleanName) {
        return res.status(400).json({
          message: "Product name is required.",
        });
      }

      if (cleanName.length > 150) {
        return res.status(400).json({
          message: "Product name is too long.",
        });
      }

      if (!cleanCategory) {
        return res.status(400).json({
          message: "Category is required.",
        });
      }

      if (cleanCategory.length > 100) {
        return res.status(400).json({
          message: "Category name is too long.",
        });
      }

if (
  !Number.isFinite(numericOriginalPrice) ||
  numericOriginalPrice < 0
) {
  return res.status(400).json({
    message: "Please enter a valid original price.",
  });
}

if (numericOriginalPrice > 10000000) {
  return res.status(400).json({
    message: "Original price is too high.",
  });
}

if (
  !Number.isFinite(numericOfferPrice) ||
  numericOfferPrice < 0
) {
  return res.status(400).json({
    message: "Please enter a valid offer price.",
  });
}

if (numericOfferPrice > 10000000) {
  return res.status(400).json({
    message: "Offer price is too high.",
  });
}

if (isSaleActive && numericOfferPrice >= numericOriginalPrice) {
  return res.status(400).json({
    message: "Offer price must be lower than original price.",
  });
}
      if (!cleanDescription) {
        return res.status(400).json({
          message: "Product description is required.",
        });
      }

      if (cleanDescription.length > 5000) {
        return res.status(400).json({
          message: "Product description is too long.",
        });
      }

      if (sizes.length === 0) {
        return res.status(400).json({
          message: "At least one frame size is required.",
        });
      }

      if (sizes.length > 20) {
        return res.status(400).json({
          message: "Too many frame sizes.",
        });
      }

      if (sizes.some((size) => size.length > 50)) {
        return res.status(400).json({
          message: "Frame size is too long.",
        });
      }

      if (cleanFrameColor.length > 100) {
        return res.status(400).json({
          message: "Frame color is too long.",
        });
      }

      if (
        stockStatus !== undefined &&
        stockStatus !== "" &&
        !["in_stock", "made_to_order"].includes(stockStatus)
      ) {
        return res.status(400).json({
          message: "Invalid stock status.",
        });
      }

      /* ---------- IMAGES ---------- */

      const images = (req.files || []).map((file) => file.path);

      if (images.length > 6) {
        return res.status(400).json({
          message: "You can upload a maximum of 6 images.",
        });
      }

      /* ---------- CREATE PRODUCT ---------- */

      const product = await Product.create({
        name: cleanName,
        category: cleanCategory,
        originalPrice: numericOriginalPrice,
        offerPrice: numericOfferPrice,
        saleActive: isSaleActive,
        sizes,
        description: cleanDescription,
        frameColor: cleanFrameColor,
        stockStatus:
          stockStatus === "in_stock"
            ? "in_stock"
            : "made_to_order",
        images,
      });

      /* ---------- KEEP CATEGORY IN SYNC ---------- */

      await Category.findOneAndUpdate(
        { name: cleanCategory },
        { name: cleanCategory },
        { upsert: true }
      );

      res.status(201).json({ product });
    } catch (err) {
      console.error("Create product error:", err);

      res.status(500).json({
        message: "Could not save product.",
      });
    }
  }
);


/* ---------- UPDATE PRODUCT ---------- */

router.put(
  "/products/:id",
  upload.array("images", 6),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found.",
        });
      }

      const {
  name,
  category,
  originalPrice,
  offerPrice,
  saleActive,
  description,
  frameColor,
  stockStatus,
} = req.body;

      /* ---------- VALIDATE / UPDATE NAME ---------- */

      if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
          return res.status(400).json({
            message: "Product name cannot be empty.",
          });
        }

        if (name.trim().length > 150) {
          return res.status(400).json({
            message: "Product name is too long.",
          });
        }

        product.name = name.trim();
      }

      /* ---------- VALIDATE / UPDATE CATEGORY ---------- */

      if (category !== undefined) {
        if (typeof category !== "string" || !category.trim()) {
          return res.status(400).json({
            message: "Category cannot be empty.",
          });
        }

        if (category.trim().length > 100) {
          return res.status(400).json({
            message: "Category name is too long.",
          });
        }

        product.category = category.trim();
      }

     /* ---------- VALIDATE / UPDATE PRICES ---------- */

if (originalPrice !== undefined) {
  const numericOriginalPrice = Number(originalPrice);

  if (
    !Number.isFinite(numericOriginalPrice) ||
    numericOriginalPrice < 0
  ) {
    return res.status(400).json({
      message: "Please enter a valid original price.",
    });
  }

  if (numericOriginalPrice > 10000000) {
    return res.status(400).json({
      message: "Original price is too high.",
    });
  }

  product.originalPrice = numericOriginalPrice;
}

if (offerPrice !== undefined) {
  const numericOfferPrice = Number(offerPrice);

  if (
    !Number.isFinite(numericOfferPrice) ||
    numericOfferPrice < 0
  ) {
    return res.status(400).json({
      message: "Please enter a valid offer price.",
    });
  }

  if (numericOfferPrice > 10000000) {
    return res.status(400).json({
      message: "Offer price is too high.",
    });
  }

  product.offerPrice = numericOfferPrice;
}

if (saleActive !== undefined) {
  product.saleActive = saleActive === "true";
}

if (
  product.saleActive &&
  product.offerPrice >= product.originalPrice
) {
  return res.status(400).json({
    message: "Offer price must be lower than original price.",
  });
}
      /* ---------- VALIDATE / UPDATE DESCRIPTION ---------- */

      if (description !== undefined) {
        if (
          typeof description !== "string" ||
          !description.trim()
        ) {
          return res.status(400).json({
            message: "Product description cannot be empty.",
          });
        }

        if (description.trim().length > 5000) {
          return res.status(400).json({
            message: "Product description is too long.",
          });
        }

        product.description = description.trim();
      }

      /* ---------- UPDATE FRAME COLOR ---------- */

      if (frameColor !== undefined) {
        if (typeof frameColor !== "string") {
          return res.status(400).json({
            message: "Invalid frame color.",
          });
        }

        if (frameColor.trim().length > 100) {
          return res.status(400).json({
            message: "Frame color is too long.",
          });
        }

        product.frameColor = frameColor.trim();
      }

      /* ---------- UPDATE STOCK STATUS ---------- */

      if (stockStatus !== undefined) {
        if (
          !["in_stock", "made_to_order"].includes(stockStatus)
        ) {
          return res.status(400).json({
            message: "Invalid stock status.",
          });
        }

        product.stockStatus = stockStatus;
      }

      /* ---------- UPDATE SIZES ---------- */

      if (req.body.sizes !== undefined) {
        if (typeof req.body.sizes !== "string") {
          return res.status(400).json({
            message: "Invalid frame sizes.",
          });
        }

        const sizes = req.body.sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (sizes.length === 0) {
          return res.status(400).json({
            message: "At least one frame size is required.",
          });
        }

        if (sizes.length > 20) {
          return res.status(400).json({
            message: "Too many frame sizes.",
          });
        }

        if (sizes.some((size) => size.length > 50)) {
          return res.status(400).json({
            message: "Frame size is too long.",
          });
        }

        product.sizes = sizes;
      }

      /* ---------- UPDATE IMAGES ---------- */

      if (req.files && req.files.length) {
        if (req.files.length > 6) {
          return res.status(400).json({
            message: "You can upload a maximum of 6 images.",
          });
        }

        product.images = req.files.map((file) => file.path);
      }

      await product.save();

      /* ---------- KEEP CATEGORY IN SYNC ---------- */

      if (category !== undefined) {
        await Category.findOneAndUpdate(
          { name: category.trim() },
          { name: category.trim() },
          { upsert: true }
        );
      }

      res.json({ product });
    } catch (err) {
      console.error("Update product error:", err);

      res.status(500).json({
        message: "Could not update product.",
      });
    }
  }
);

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete product." });
  }
});

/* ---------------- CATEGORIES ---------------- */
router.get("/categories", async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});

router.post("/categories", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Category name is required." });
    const category = await Category.findOneAndUpdate(
      { name: name.trim() },
      { name: name.trim() },
      { upsert: true, new: true }
    );
    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ message: "Could not save category." });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete category." });
  }
});

/* ---------------- ORDERS ---------------- */
router.get("/orders", async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.orderStatus = status;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { "shippingAddress.fullName": regex },
        { "shippingAddress.mobile": regex },
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : undefined },
      ];
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Could not load orders." });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["placed", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status." });

    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: "Could not update order." });
  }
});

// Refund structure only — actual refund must be triggered from the Razorpay
// dashboard (or via razorpay.payments.refund(...) once you're ready to wire it up).
router.patch("/orders/:id/refund", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Only paid orders can be refunded." });
    }
    order.paymentStatus = "refunded";
    order.orderStatus = "cancelled";
    await order.save();
    res.json({ message: "Order marked as refunded. Process the actual refund in your Razorpay dashboard.", order });
  } catch (err) {
    res.status(500).json({ message: "Could not update refund status." });
  }
});

// Export all orders as CSV
router.get("/orders/export/csv", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const header = [
      "Order ID", "Date", "Customer", "Mobile", "City", "State", "Pincode",
      "Items Total", "Delivery Charge", "Total Amount", "Payment Status", "Order Status",
    ];
    const rows = orders.map((o) => [
      o._id,
      o.createdAt.toISOString(),
      o.shippingAddress.fullName,
      o.shippingAddress.mobile,
      o.shippingAddress.city,
      o.shippingAddress.state,
      o.shippingAddress.pincode,
      o.itemsTotal,
      o.deliveryCharge,
      o.totalAmount,
      o.paymentStatus,
      o.orderStatus,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=husna-artistry-orders.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "Could not export orders." });
  }
});

/* ---------------- USERS ---------------- */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Could not load users." });
  }
});

router.patch("/users/:id/block", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: !!req.body.isBlocked },
      { new: true }
    ).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Could not update user." });
  }
});

/* ---------------- DASHBOARD ---------------- */
router.get("/dashboard", async (req, res) => {
  try {
    const [productCount, userCount, orders] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Order.find(),
    ]);

    const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
    const revenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const recentOrders = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const madeToOrderCount = await Product.countDocuments({ stockStatus: "made_to_order" });

    const statusBreakdown = orders.reduce((acc, o) => {
      acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
      return acc;
    }, {});

    res.json({
      productCount,
      userCount,
      orderCount: orders.length,
      revenue,
      madeToOrderCount,
      statusBreakdown,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not load dashboard data." });
  }
});

module.exports = router;
