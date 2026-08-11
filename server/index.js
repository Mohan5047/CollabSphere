require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const app = express();
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const teamRoutes = require("./routes/teamRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const learningCategoryRoutes = require("./routes/learningCategoryRoutes");
const courseRoutes = require("./routes/courseRoutes"); // Import course routes
const learningTrackRoutes = require("./routes/learningTracksRoutes"); // Import learning tracks routes
const moduleRoutes = require("./routes/moduleRoutes"); // Import module routes
const lessonRoutes = require("./routes/lessonRoutes"); // Import lesson routes

pool
  .query("SELECT NOW()")
  .then((result) => {
    console.log("✅ Database Connected");
    console.log(result.rows[0]);
  })
  .catch((err) => {
    console.error("❌ Database Connection Failed");
    console.error(err.message);
  });
app.use(cors());

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/learning-categories", learningCategoryRoutes); 
app.use("/api/learning-tracks", learningTrackRoutes); // Use the imported learning tracks routes
app.use("/api/courses", require("./routes/courseRoutes")); // Use the course routes
app.use("/api/modules", require("./routes/moduleRoutes")); // Use the module routes
app.use("/api/lessons", lessonRoutes); // Use the imported lesson routes
app.get("/", (req, res) => {
    res.send("🚀 CollabSphere Backend Running Successfully");
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});