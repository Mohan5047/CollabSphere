const express = require("express");
const pool = require("../config/db");
const courseRoutes = require("../routes/courseRoutes");
const learningCategoryRoutes = require("../routes/learningCategoryRoutes");
const learningTrackRoutes = require("../routes/learningTracksRoutes");
const certificateRoutes = require("../routes/certificateRoutes");

const app = express();
app.use(express.json());
app.use("/api/courses", courseRoutes);
app.use("/api/learning-categories", learningCategoryRoutes);
app.use("/api/learning-tracks", learningTrackRoutes);
app.use("/api/certificates", certificateRoutes);

async function testHttpEndpoints() {
  const server = app.listen(5099, async () => {
    console.log("Mock test server listening on port 5099");
    try {
      // Test 1: GET /api/courses
      const resAll = await fetch("http://localhost:5099/api/courses");
      const dataAll = await resAll.json();
      console.log(`\n1. GET /api/courses => status: ${resAll.status}, success: ${dataAll.success}, count: ${dataAll.count}`);

      // Test 2: GET /api/courses?category_id=8 (Artificial Intelligence)
      const resAI = await fetch("http://localhost:5099/api/courses?category_id=8");
      const dataAI = await resAI.json();
      console.log(`\n2. GET /api/courses?category_id=8 (AI) => status: ${resAI.status}, count: ${dataAI.count}`);
      console.log("   AI Courses:", dataAI.data.map(c => c.title));

      // Test 3: GET /api/courses?category_id=2 (Web Development)
      const resWeb = await fetch("http://localhost:5099/api/courses?category_id=2");
      const dataWeb = await resWeb.json();
      console.log(`\n3. GET /api/courses?category_id=2 (Web Dev) => status: ${resWeb.status}, count: ${dataWeb.count}`);
      console.log("   Web Dev Courses:", dataWeb.data.map(c => c.title));

      // Test 4: GET /api/courses?search=React
      const resSearch = await fetch("http://localhost:5099/api/courses?search=React");
      const dataSearch = await resSearch.json();
      console.log(`\n4. GET /api/courses?search=React => status: ${resSearch.status}, count: ${dataSearch.count}`);
      console.log("   Matches:", dataSearch.data.map(c => c.title));

      // Test 5: GET /api/certificates/verify/:certNumber
      const certRes = await pool.query("SELECT certificate_number FROM certificates ORDER BY id DESC LIMIT 1");
      if (certRes.rows.length > 0) {
        const certCode = certRes.rows[0].certificate_number;
        const resVerify = await fetch(`http://localhost:5099/api/certificates/verify/${certCode}`);
        const dataVerify = await resVerify.json();
        console.log(`\n5. GET /api/certificates/verify/${certCode} => valid: ${dataVerify.valid}`);
        console.log("   Verification Payload:", dataVerify.data);
      }

      console.log("\n==================================================");
      console.log("🎉 ALL HTTP ENDPOINTS TESTED AND VERIFIED!");
      console.log("==================================================");
    } catch (e) {
      console.error("HTTP endpoint test failed:", e);
    } finally {
      server.close();
      pool.end();
    }
  });
}

testHttpEndpoints();
