const router = require("express").Router();
const Income = require("../models/income");
const auth = require("../middleware/auth");
const Archive = require("../models/archive");
const mongoose = require("mongoose");

// Get all income entries for a user
router.get("/", auth, async (req, res) => {
  try {
    const incomes = await Income.find({ userId: req.user._id }).sort({
      date: -1,
    });
    res.json(incomes);
  } catch (error) {
    res.status(500).send({ message: "Error fetching income entries" });
  }
});

// Create new income entry
router.post("/", auth, async (req, res) => {
  try {
    const income = new Income({
      ...req.body,
      userId: req.user._id,
    });
    await income.save();
    res.status(201).json(income);
  } catch (error) {
    res.status(500).send({ message: "Error creating income entry" });
  }
});

// Update income entry
router.put("/:id", auth, async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!income)
      return res.status(404).send({ message: "Income entry not found" });
    res.json(income);
  } catch (error) {
    res.status(500).send({ message: "Error updating income entry" });
  }
});

// Delete income entry
router.delete("/:id", auth, async (req, res) => {
  try {
    console.log("Attempting to delete income with ID:", req.params.id);

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send({ message: "Invalid income ID format" });
    }

    // Find the income to be deleted
    const income = await Income.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!income) {
      return res.status(404).send({ message: "Income not found" });
    }

    // Find or create archive document for this user
    let archive = await Archive.findOne({ userId: req.user._id });
    if (!archive) {
      archive = new Archive({
        userId: req.user._id,
        expenses: [],
        incomes: [],
      });
    }

    // Create a plain object with only the needed fields
    const archivedIncome = {
      source: income.source || "",
      amount: Number(income.amount) || 0,
      date: new Date(income.date),
      description: income.description || "",
      type: income.type || "other",
      deletedAt: new Date(),
      originalId: income._id.toString(),
    };

    // Add the income to archive
    archive.incomes.push(archivedIncome);

    // Save the archive first
    await archive.save();

    // Then delete the original income
    await Income.findByIdAndDelete(req.params.id);

    res.json({
      message: "Income archived and deleted successfully",
      deletedId: income._id,
    });
  } catch (error) {
    console.error("Server delete error:", error);
    res.status(500).send({
      message: "Error deleting income entry",
      error: error.message,
    });
  }
});

module.exports = router;
