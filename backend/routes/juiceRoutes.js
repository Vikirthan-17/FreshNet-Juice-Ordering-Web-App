const express = require("express");
const Juice = require("../models/Juice");
const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// PUBLIC: GET all available juices
router.get("/", async (req, res) => {
  try {
    const juices = await Juice.find().sort({ createdAt: -1 });
    res.status(200).json(juices);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch juices",
      error: error.message,
    });
  }
});

// ADMIN: POST add new juice
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { name, category, price, description, image, isAvailable } = req.body;

    if (!name || !category || !price || !description) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const newJuice = new Juice({
      name,
      category,
      price,
      description,
      image,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    const savedJuice = await newJuice.save();

    res.status(201).json(savedJuice);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add juice",
      error: error.message,
    });
  }
});

// ADMIN: PUT update juice
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const updatedJuice = await Juice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedJuice) {
      return res.status(404).json({
        message: "Juice not found",
      });
    }

    res.status(200).json(updatedJuice);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update juice",
      error: error.message,
    });
  }
});

// ADMIN: PATCH availability ON/OFF
router.patch("/:id/availability", protectAdmin, async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const updatedJuice = await Juice.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true, runValidators: true }
    );

    if (!updatedJuice) {
      return res.status(404).json({
        message: "Juice not found",
      });
    }

    res.status(200).json(updatedJuice);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update availability",
      error: error.message,
    });
  }
});

// ADMIN: DELETE juice
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const deletedJuice = await Juice.findByIdAndDelete(req.params.id);

    if (!deletedJuice) {
      return res.status(404).json({
        message: "Juice not found",
      });
    }

    res.status(200).json({
      message: "Juice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete juice",
      error: error.message,
    });
  }
});

module.exports = router;