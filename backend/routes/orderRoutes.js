const express = require("express");
const Order = require("../models/Order");
const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// ADMIN: GET all orders
router.get("/", protectAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

// PUBLIC: POST create order
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      phoneNumber,
      address,
      paymentMethod,
      paymentReference,
      deliveryType,
      items,
    } = req.body;

    if (!customerName || !phoneNumber || !items || items.length === 0) {
      return res.status(400).json({
        message: "Please provide customer details and items",
      });
    }

    const totalAmount = items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);

    const newOrder = new Order({
      customerName,
      phoneNumber,
      address,
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentReference: paymentReference || "",
      deliveryType: deliveryType || "Delivery",
      items,
      totalAmount,
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "Order placed successfully",
      order: savedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
});

// ADMIN: PUT update order status
router.put("/:id/status", protectAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Preparing", "Delivered", "Cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
});

// ADMIN: DELETE order
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete order",
      error: error.message,
    });
  }
});

module.exports = router;