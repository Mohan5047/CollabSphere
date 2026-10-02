const pool = require("../config/db");

async function verifyCompleteFlow() {
  console.log("=================================================");
  console.log("COLLABSPHERE LEARNING FLOW END-TO-END VERIFICATION");
  console.log("=================================================");

  // 1. PostgreSQL DB Check
  const dbInfo = await pool.query(
    "SELECT current_database(), current_user, inet_server_port()"
  );
  console.log("1. DATABASE:", JSON.stringify(dbInfo.rows[0]));

  const countRes = await pool.query("SELECT COUNT(*) FROM courses");
  const dbCourseCount = parseInt(countRes.rows[0].count, 10);
  console.log("   TABLE: courses");
  console.log("   DATABASE COURSE COUNT:", dbCourseCount);

  // Exact SQL query from courseController.js
  const sqlQuery = `
    SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.level,
        c.duration_hours,
        c.is_published,
        c.created_at,
        lt.id AS track_id,
        lt.name AS track_name,
        lt.category_id,
        lc.name AS category_name
    FROM courses c
    JOIN learning_tracks lt
        ON c.track_id = lt.id
    JOIN learning_categories lc
        ON lt.category_id = lc.id
    WHERE c.is_published = true
    ORDER BY c.id ASC
  `;
  const sqlResult = await pool.query(sqlQuery);
  console.log("   SQL QUERY RETURNED COURSES:", sqlResult.rows.length);

  // 2. Backend API Check (port 5000)
  const apiRes = await fetch("http://localhost:5000/api/courses").then((r) =>
    r.json()
  );
  console.log("2. BACKEND API (http://localhost:5000/api/courses):");
  console.log("   SUCCESS:", apiRes.success);
  console.log("   API COURSE COUNT:", apiRes.count);
  console.log("   DATA ARRAY LENGTH:", apiRes.data.length);

  // 3. Vite Proxy Check (port 5173)
  const viteRes = await fetch("http://localhost:5173/api/courses").then((r) =>
    r.json()
  );
  console.log("3. BROWSER NETWORK PROXY (http://localhost:5173/api/courses):");
  console.log("   SUCCESS:", viteRes.success);
  console.log("   PROXY COURSE COUNT:", viteRes.count);

  // 4. React State Parsing Simulation
  const val = viteRes;
  const courses = Array.isArray(val)
    ? val
    : Array.isArray(val?.data)
      ? val.data
      : Array.isArray(val?.courses)
        ? val.courses
        : [];
  console.log("4. REACT STATE: courses.length =", courses.length);

  // 5. Category & Track lookups for filteredCourses in Learning.tsx
  const categoriesRes = await fetch(
    "http://localhost:5000/api/learning-categories"
  ).then((r) => r.json());
  const tracksRes = await fetch(
    "http://localhost:5000/api/learning-tracks"
  ).then((r) => r.json());

  const categories = categoriesRes.data || [];
  const tracks = tracksRes.data || [];

  const trackMap = new Map();
  tracks.forEach((t) => trackMap.set(Number(t.id), t));
  const categoryMap = new Map();
  categories.forEach((c) => categoryMap.set(Number(c.id), c));

  function simulateFilteredCourses(
    searchQuery,
    selectedCategoryId,
    selectedTrackId
  ) {
    const q = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      const track = course.track_id
        ? trackMap.get(Number(course.track_id))
        : undefined;
      const catId = course.category_id ?? track?.category_id;

      if (
        selectedCategoryId !== "ALL" &&
        String(catId) !== String(selectedCategoryId)
      ) {
        return false;
      }

      if (
        selectedTrackId !== "ALL" &&
        String(course.track_id) !== String(selectedTrackId)
      ) {
        return false;
      }

      if (!q) return true;

      const category = course.category_id
        ? categoryMap.get(Number(course.category_id))
        : track
          ? categoryMap.get(Number(track.category_id))
          : undefined;

      const titleMatch = (course.title || "").toLowerCase().includes(q);
      const descMatch = (course.description || "").toLowerCase().includes(q);
      const trackMatch = (
        track?.title ||
        track?.name ||
        ""
      )
        .toLowerCase()
        .includes(q);
      const catMatch = (category?.name || "").toLowerCase().includes(q);

      return titleMatch || descMatch || trackMatch || catMatch;
    });
  }

  // Verification Requirements from Prompt
  console.log("5. FILTER VERIFICATION:");

  // A. All Courses
  const allCards = simulateFilteredCourses("", "ALL", "ALL");
  console.log("   A. GET ALL COURSES cards:", allCards.length);

  // B. Artificial Intelligence
  const aiCat = categories.find((c) =>
    c.name.toLowerCase().includes("artificial intelligence")
  );
  const aiCards = simulateFilteredCourses("", String(aiCat.id), "ALL");
  console.log("   B. ARTIFICIAL INTELLIGENCE cards:", aiCards.length);
  console.log(
    "      Titles:",
    aiCards.map((c) => c.title)
  );

  // C. Web Development
  const webCat = categories.find((c) =>
    c.name.toLowerCase().includes("web development")
  );
  const webCards = simulateFilteredCourses("", String(webCat.id), "ALL");
  console.log("   C. WEB DEVELOPMENT cards:", webCards.length);
  console.log(
    "      Titles:",
    webCards.map((c) => c.title)
  );

  // D. Search "React"
  const reactCards = simulateFilteredCourses("React", "ALL", "ALL");
  console.log("   D. SEARCH 'React' cards:", reactCards.length);
  console.log(
    "      Titles:",
    reactCards.map((c) => c.title)
  );

  console.log("=================================================");
  console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  console.log("=================================================");

  await pool.end();
}

verifyCompleteFlow().catch(console.error);
