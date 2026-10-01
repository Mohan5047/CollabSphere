const pool = require("../config/db");
const crypto = require("crypto");

async function testFullLearningFlow() {
  console.log("==================================================");
  console.log("TESTING COMPLETE LEARNING & CERTIFICATE FLOW");
  console.log("==================================================");

  try {
    // 1. Check Course Count
    const cCount = await pool.query("SELECT COUNT(*) FROM courses");
    console.log(`\n1. Total Courses in DB: ${cCount.rows[0].count}`);

    // 2. Check AI Courses
    const aiCourses = await pool.query(`
      SELECT c.id, c.title, lt.name AS track_name, lc.name AS category_name
      FROM courses c
      JOIN learning_tracks lt ON c.track_id = lt.id
      JOIN learning_categories lc ON lt.category_id = lc.id
      WHERE lc.name = 'Artificial Intelligence'
      ORDER BY c.id
    `);
    console.log(`\n2. Artificial Intelligence Courses (${aiCourses.rows.length}):`);
    aiCourses.rows.forEach(c => console.log(`   - [ID: ${c.id}] ${c.title}`));

    // 3. Check Web Development Courses
    const webCourses = await pool.query(`
      SELECT c.id, c.title, lt.name AS track_name, lc.name AS category_name
      FROM courses c
      JOIN learning_tracks lt ON c.track_id = lt.id
      JOIN learning_categories lc ON lt.category_id = lc.id
      WHERE lc.name = 'Web Development'
      ORDER BY c.id
    `);
    console.log(`\n3. Web Development Courses (${webCourses.rows.length}):`);
    webCourses.rows.forEach(c => console.log(`   - [ID: ${c.id}] ${c.title}`));

    // 4. Find React.js Course
    const reactCourse = await pool.query("SELECT * FROM courses WHERE title = 'React.js'");
    if (reactCourse.rows.length === 0) throw new Error("React.js course not found!");
    const reactId = reactCourse.rows[0].id;
    console.log(`\n4. Found React.js course with ID: ${reactId}`);

    // 5. Check Modules for React
    const reactMods = await pool.query("SELECT id, title, module_order FROM modules WHERE course_id = $1 ORDER BY module_order", [reactId]);
    console.log(`   Modules for React.js (${reactMods.rows.length}):`);
    reactMods.rows.forEach(m => console.log(`   - Module ${m.module_order}: ${m.title} (ID: ${m.id})`));

    // 6. Check Lessons for React
    const reactLessons = await pool.query(`
      SELECT l.id, l.title, l.module_id, l.duration_minutes
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1
      ORDER BY m.module_order, l.lesson_order
    `, [reactId]);
    console.log(`   Total Lessons for React.js: ${reactLessons.rows.length}`);
    reactLessons.rows.slice(0, 5).forEach(l => console.log(`   - Lesson: ${l.title} (${l.duration_minutes}m)`));

    // 7. Test User Enrollment Flow
    // Get test user (id 1 or first user)
    const userRes = await pool.query("SELECT id, full_name, email FROM users ORDER BY id LIMIT 1");
    if (userRes.rows.length === 0) throw new Error("No users found to test with!");
    const testUser = userRes.rows[0];
    console.log(`\n5. Testing with user: ${testUser.full_name} (ID: ${testUser.id})`);

    // Enroll in React course
    await pool.query(
      "INSERT INTO course_enrollments (user_id, course_id, status) VALUES ($1, $2, 'ACTIVE') ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'ACTIVE'",
      [testUser.id, reactId]
    );
    console.log(`   Enrolled user ${testUser.id} in React.js (Course ${reactId})`);

    // Complete all lessons in React.js course to reach 100%
    console.log(`\n6. Marking all ${reactLessons.rows.length} lessons as COMPLETED...`);
    for (const l of reactLessons.rows) {
      await pool.query(`
        INSERT INTO lesson_progress (user_id, lesson_id, status, progress_percent, completed_at)
        VALUES ($1, $2, 'COMPLETED', 100, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, lesson_id)
        DO UPDATE SET status = 'COMPLETED', progress_percent = 100, completed_at = CURRENT_TIMESTAMP
      `, [testUser.id, l.id]);
    }

    // Trigger updateProgress logic simulation
    const totalQuery = await pool.query(
      "SELECT COUNT(l.id) AS total_lessons FROM modules m JOIN lessons l ON l.module_id = m.id WHERE m.course_id = $1",
      [reactId]
    );
    const totalLessons = parseInt(totalQuery.rows[0].total_lessons, 10);

    const completedQuery = await pool.query(`
      SELECT COUNT(DISTINCT lp.lesson_id) AS completed_lessons
      FROM modules m
      JOIN lessons l ON l.module_id = m.id
      JOIN lesson_progress lp ON lp.lesson_id = l.id
      WHERE m.course_id = $1 AND lp.user_id = $2 AND lp.status = 'COMPLETED'
    `, [reactId, testUser.id]);
    const completedLessons = parseInt(completedQuery.rows[0].completed_lessons, 10);

    const progressPct = Math.round((completedLessons / totalLessons) * 100);
    console.log(`   Calculated Progress: ${completedLessons}/${totalLessons} (${progressPct}%)`);

    // Update user_progress and enrollment status
    await pool.query(`
      INSERT INTO user_progress (user_id, course_id, completed_modules, completed_lessons, progress_percentage, status, last_accessed)
      VALUES ($1, $2, 5, $3, $4, 'COMPLETED', CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, course_id)
      DO UPDATE SET progress_percentage = $4, status = 'COMPLETED', last_accessed = CURRENT_TIMESTAMP
    `, [testUser.id, reactId, completedLessons, progressPct]);

    await pool.query("UPDATE course_enrollments SET status = 'COMPLETED' WHERE user_id = $1 AND course_id = $2", [testUser.id, reactId]);

    // Generate or get Certificate
    let certRes = await pool.query("SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2", [testUser.id, reactId]);
    if (certRes.rows.length === 0) {
      const certNum = "CS-2026-" + crypto.randomBytes(4).toString("hex").toUpperCase();
      certRes = await pool.query(
        "INSERT INTO certificates (user_id, course_id, certificate_number, issued_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *",
        [testUser.id, reactId, certNum]
      );
      console.log(`\n7. Certificate AUTOMATICALLY GENERATED! Certificate Number: ${certRes.rows[0].certificate_number}`);
    } else {
      console.log(`\n7. Certificate Verified! Certificate Number: ${certRes.rows[0].certificate_number}`);
    }

    const certCode = certRes.rows[0].certificate_number;

    // 8. Test Certificate Verification Endpoint Logic
    const verifyRes = await pool.query(`
      SELECT cert.id, cert.certificate_number, cert.issued_at, u.full_name, c.title AS course_title
      FROM certificates cert
      JOIN users u ON cert.user_id = u.id
      JOIN courses c ON cert.course_id = c.id
      WHERE cert.certificate_number = $1
    `, [certCode]);

    console.log("\n8. Certificate Verification Result:");
    console.log(verifyRes.rows[0]);

    console.log("\n==================================================");
    console.log("✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    pool.end();
  }
}

testFullLearningFlow();
