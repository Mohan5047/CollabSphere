const fetch = globalThis.fetch;

async function testFrontendLogic() {
  const categoriesRes = await fetch('http://localhost:5000/api/learning-categories').then(r => r.json());
  const tracksRes = await fetch('http://localhost:5000/api/learning-tracks').then(r => r.json());
  const coursesRes = await fetch('http://localhost:5000/api/courses').then(r => r.json());

  // Step A: Parse courses like Learning.tsx line 92-98
  const courses = Array.isArray(coursesRes.data)
    ? coursesRes.data
    : Array.isArray(coursesRes.courses)
      ? coursesRes.courses
      : [];
  console.log('Parsed courses count:', courses.length);

  const categories = categoriesRes.data || [];
  const tracks = tracksRes.data || [];

  // Track map & Category map
  const trackMap = new Map();
  tracks.forEach(t => trackMap.set(Number(t.id), t));
  const categoryMap = new Map();
  categories.forEach(c => categoryMap.set(Number(c.id), c));

  function filterCourses(searchQuery, selectedCategoryId, selectedTrackId) {
    const q = searchQuery.trim().toLowerCase();
    return courses.filter(course => {
      const track = course.track_id ? trackMap.get(Number(course.track_id)) : undefined;
      const catId = course.category_id ?? track?.category_id;
      if (selectedCategoryId !== 'ALL' && String(catId) !== String(selectedCategoryId)) return false;
      if (selectedTrackId !== 'ALL' && String(course.track_id) !== String(selectedTrackId)) return false;
      if (!q) return true;
      const category = course.category_id ? categoryMap.get(Number(course.category_id)) : track ? categoryMap.get(Number(track.category_id)) : undefined;
      const titleMatch = (course.title || '').toLowerCase().includes(q);
      const descMatch = (course.description || '').toLowerCase().includes(q);
      const trackMatch = (track?.title || track?.name || '').toLowerCase().includes(q);
      const catMatch = (category?.name || '').toLowerCase().includes(q);
      return titleMatch || descMatch || trackMatch || catMatch;
    });
  }

  console.log('ALL courses filter result:', filterCourses('', 'ALL', 'ALL').length);

  // Test 2: Artificial Intelligence
  const aiCat = categories.find(c => c.name.toLowerCase().includes('artificial intelligence'));
  console.log('AI Category ID:', aiCat.id, 'Name:', aiCat.name);
  const aiFiltered = filterCourses('', String(aiCat.id), 'ALL');
  console.log('AI Filtered courses count:', aiFiltered.length);
  console.log('AI Course Titles:', aiFiltered.map(c => c.title));

  // Test 3: Web Development
  const webCat = categories.find(c => c.name.toLowerCase().includes('web development'));
  console.log('Web Dev Category ID:', webCat.id, 'Name:', webCat.name);
  const webFiltered = filterCourses('', String(webCat.id), 'ALL');
  console.log('Web Dev Filtered courses count:', webFiltered.length);
  console.log('Web Dev Course Titles:', webFiltered.map(c => c.title));

  // Test 4: Search "React"
  const reactFiltered = filterCourses('React', 'ALL', 'ALL');
  console.log('React search count:', reactFiltered.length);
  console.log('React Course Titles:', reactFiltered.map(c => c.title));
}

testFrontendLogic().catch(console.error);
