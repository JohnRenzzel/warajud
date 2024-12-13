const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    default: "",
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    default: "other",
  },
});

const incomeSchema = new mongoose.Schema({
  source: {
    type: String,
    default: "",
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "other",
  },
});

const backupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    expenses: [expenseSchema],
    incomes: [incomeSchema],
  },
  { timestamps: true }
);

const Backup = mongoose.model("backup", backupSchema);

module.exports = Backup;
