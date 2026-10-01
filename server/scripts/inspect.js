const pool = require('../config/db');

async function inspect() {
  try {
    const tables = [
      'learning_categories',
      'learning_tracks',
      'courses',
      'modules',
      'lessons',
      'lesson_resources',
      'course_enrollments',
      'lesson_progress',
      'user_progress',
      'quizzes',
      'quiz_questions',
      'quiz_attempts',
      'certificates',
      'users'
    ];

    for (const t of tables) {
      const cols = await pool.query(
        "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
        [t]
      );
      console.log('=== ' + t + ' ===');
      cols.rows.forEach(c => {
        console.log(`  ${c.column_name}: ${c.data_type} (null: ${c.is_nullable}, default: ${c.column_default})`);
      });
    }

    // Check counts
    console.log('\n=== ROW COUNTS ===');
    for (const t of tables) {
      const res = await pool.query(`SELECT COUNT(*) FROM ${t}`);
    }

    console.log('\n=== CONSTRAINT DEFINITIONS ===');
    const cdefs = await pool.query(
      "SELECT conname, pg_get_constraintdef(c.oid) as def FROM pg_constraint c WHERE conname IN ('chk_enrollment_status', 'user_progress_status_check')"
    );
    cdefs.rows.forEach(c => console.log(`  ${c.conname}: ${c.def}`));
  } catch (err) {
    console.error('Error inspecting:', err);
  } finally {
    pool.end();
  }
}

inspect();
