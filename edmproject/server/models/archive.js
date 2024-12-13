const mongoose = require("mongoose");

const archivedIncomeSchema = new mongoose.Schema({
  source: String,
  amount: Number,
  date: Date,
  description: String,
  type: String,
  deletedAt: Date,
  originalId: String,
});

const archivedExpenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  date: Date,
  category: String,
  deletedAt: Date,
  originalId: String,
});

const archivedDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    expenses: [archivedExpenseSchema],
    incomes: [archivedIncomeSchema],
  },
  { timestamps: true }
);

const Archive = mongoose.model("archive", archivedDataSchema);

module.exports = Archive;
