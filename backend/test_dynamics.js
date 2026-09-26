async function testDynamics() {
  console.log("=== Testing Dynamic Career Pathways ===");
  let res = await fetch('http://localhost:5000/api/career-pathways');
  let pathways = await res.json();
  console.log("Initial Pathways:", pathways);

  console.log("\n=== Testing Placement Submission ===");
  // Need a college token to submit
  let login = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'jiet@demo.com', password: 'demo123' })
  });
  let loginData = await login.json();
  
  if (loginData.token) {
    let placeRes = await fetch('http://localhost:5000/api/placements', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        studentEmail: 'student1@test.com',
        companyName: 'TCS',
        jobRole: 'Full Stack Developer',
        package: '8 LPA',
        location: 'Pune'
      })
    });
    console.log("Placement Result:", await placeRes.json());
  } else {
    console.log("Login failed", loginData);
  }

  console.log("\n=== Fetching Updated Placements ===");
  res = await fetch('http://localhost:5000/api/placements');
  console.log("Placements:", await res.json());
}
testDynamics();
