// Quick test script
async function test() {
  // 1. Test seed
  console.log("=== Seeding demo data ===");
  let res = await fetch('http://localhost:5000/api/seed', { method: 'POST' });
  console.log("Seed:", (await res.json()));

  // 2. Test register
  console.log("\n=== Testing registration ===");
  res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'JIET', email: 'jiet@demo.com', password: 'demo123', role: 'COLLEGE', location: 'Jodhpur', organization: 'JIET' })
  });
  console.log("Register:", (await res.json()));

  // 3. Test jobs
  console.log("\n=== Jobs ===");
  res = await fetch('http://localhost:5000/api/jobs');
  const jobs = await res.json();
  console.log("Total jobs:", jobs.length);

  // 4. Test dashboard stats
  console.log("\n=== Dashboard ===");
  res = await fetch('http://localhost:5000/api/analytics/dashboard');
  console.log("Stats:", (await res.json()));
}
test();
