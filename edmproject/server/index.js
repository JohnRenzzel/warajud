require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const incomeRoutes = require("./routes/income");
const backupRoutes = require("./routes/backup");
const Archive = require("./models/archive");
const Income = require("./models/income");
const archiveRoutes = require("./routes/archive");

//database connection
connection();

//middlewares
app.use(express.json());
app.use(cors());

//routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/archive", archiveRoutes);

const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Server is running on port ${port}`));
