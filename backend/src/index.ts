import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const ML_ENGINE_URL = 'http://127.0.0.1:5001';

app.use(cors());
app.use(express.json());

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const authenticate = (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, location, organization } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, location: location || '', organization: organization || '' }
    });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, location: user.location } });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { res.status(400).json({ message: 'Invalid credentials' }); return; }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) { res.status(400).json({ message: 'Invalid credentials' }); return; }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, location: user.location } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// JOB POSTING ROUTES (COMPANY)
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/jobs', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'COMPANY') return res.status(403).json({ message: 'Only companies can post jobs' });
  const { title, description, requirements, sector, location, proficiencyLevel, minExperience, salaryRange } = req.body;
  try {
    const job = await prisma.jobPosting.create({
      data: {
        title, description, requirements,
        sector: sector || 'IT',
        location: location || '',
        proficiencyLevel: proficiencyLevel || 'Intermediate',
        minExperience: minExperience || 0,
        salaryRange: salaryRange || '',
        companyId: req.user.id
      }
    });
    res.json(job);
  } catch (error) {
    console.error("Job Post Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await prisma.jobPosting.findMany({
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SYLLABUS ROUTES (COLLEGE) + ML GAP ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/syllabus', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'COLLEGE') return res.status(403).json({ message: 'Only colleges can upload syllabus' });
  const { branch, semester, subjects, content, university, lastUpdated } = req.body;
  try {
    const syllabus = await prisma.syllabus.create({
      data: {
        branch, semester, subjects: subjects || 'Various', content,
        university: university || '',
        lastUpdated: lastUpdated || '2024',
        collegeId: req.user.id
      }
    });

    // Fetch all job requirements for gap analysis
    const jobs = await prisma.jobPosting.findMany();
    const allJobRequirements = jobs.map(j => `${j.title}: ${j.requirements}`).join('. ');

    // Call Python ML Microservice
    try {
      const mlResponse = await axios.post(`${ML_ENGINE_URL}/analyze`, {
        syllabusText: content,
        jobText: allJobRequirements
      });

      const mlData = mlResponse.data;

      const gapReport = await prisma.gapReport.create({
        data: {
          missingSkills: (mlData.missing_skills || []).join(', '),
          matchedSkills: (mlData.matched_skills || []).join(', '),
          obsoleteSkills: (mlData.obsolete_skills || []).join(', '),
          recommendations: JSON.stringify(mlData.recommendations || []),
          overallScore: mlData.alignment_score || 0,
          demandAnalysis: JSON.stringify(mlData.demand_analysis || {}),
          collegeId: req.user.id,
          syllabusId: syllabus.id
        }
      });
      res.json({ syllabus, gapReport, mlData });
    } catch (mlError) {
      console.error('ML Engine Error:', mlError);
      // Still save syllabus even if ML fails
      res.json({ syllabus, gapReport: null, mlError: 'ML engine unavailable' });
    }
  } catch (error) {
    console.error("Syllabus Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/syllabus', async (req, res) => {
  try {
    const syllabuses = await prisma.syllabus.findMany({
      include: { college: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(syllabuses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GAP REPORT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/reports', async (req, res) => {
  try {
    const reports = await prisma.gapReport.findMany({
      include: {
        college: { select: { name: true, location: true } },
        syllabus: { select: { branch: true, semester: true, university: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Employer validation of gap reports
app.post('/api/reports/:id/validate', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'COMPANY') return res.status(403).json({ message: 'Only companies can validate reports' });
  const { id } = req.params;
  const { action, note } = req.body; // action = 'validate' | 'dispute'
  try {
    const report = await prisma.gapReport.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Store validation info in demandAnalysis JSON field
    let demandData: any = {};
    try { demandData = JSON.parse(report.demandAnalysis || '{}'); } catch(e) {}
    const validations: any[] = demandData.validations || [];
    validations.push({
      companyId: req.user.id,
      action,
      note: note || '',
      timestamp: new Date().toISOString()
    });
    demandData.validations = validations;
    demandData.validationStatus = action === 'validate' ? 'Employer Validated' : 'Employer Disputed';

    const updated = await prisma.gapReport.update({
      where: { id },
      data: { demandAnalysis: JSON.stringify(demandData) }
    });
    res.json({ message: `Report ${action}d successfully`, status: demandData.validationStatus });
  } catch (error) {
    console.error('Validate Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// College marks a gap report as 'Revised' after updating curriculum
app.patch('/api/reports/:id/status', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'COLLEGE') return res.status(403).json({ message: 'Only colleges can mark reports as revised' });
  const { id } = req.params;
  const { status } = req.body; // e.g. 'Revised', 'Under Review'
  try {
    const report = await prisma.gapReport.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    // Store revision status inside demandAnalysis JSON
    let demandData: any = {};
    try { demandData = JSON.parse(report.demandAnalysis || '{}'); } catch(e) {}
    demandData.revisionStatus = status || 'Revised';
    demandData.revisedAt = new Date().toISOString();
    demandData.revisedBy = req.user.id;
    const updated = await prisma.gapReport.update({
      where: { id },
      data: { demandAnalysis: JSON.stringify(demandData) }
    });
    res.json({ message: 'Report marked as ' + (status || 'Revised'), report: updated });
  } catch (error) {
    console.error('Report Status Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYER SURVEY ROUTES (COMPANY)
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/surveys', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'COMPANY') return res.status(403).json({ message: 'Only companies can submit surveys' });
  const { satisfactionScore, feedbackText, skillsNeeded, hiringDistrict, candidateQuality } = req.body;
  try {
    const survey = await prisma.employerSurvey.create({
      data: {
        satisfactionScore: satisfactionScore || 3,
        feedbackText: feedbackText || '',
        skillsNeeded: skillsNeeded || '',
        hiringDistrict: hiringDistrict || '',
        candidateQuality: candidateQuality || 'Average',
        companyId: req.user.id
      }
    });
    res.json(survey);
  } catch (error) {
    console.error("Survey Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/surveys', async (req, res) => {
  try {
    const surveys = await prisma.employerSurvey.findMany({
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// INDUSTRY CONSULTATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// In-memory store for consultations (SQLite schema avoids migration complexity)
const consultations: any[] = [];

app.post('/api/consultations', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'COMPANY') return res.status(403).json({ message: 'Only companies/industry bodies can submit consultations' });
  const { sector, district, requiredRoles, emergingSkills, timeline, urgency, notes } = req.body;
  if (!sector || !district || !requiredRoles) {
    return res.status(400).json({ message: 'sector, district, and requiredRoles are required' });
  }
  const consultation = {
    id: `c-${Date.now()}`,
    companyId: req.user.id,
    sector,
    district,
    requiredRoles,
    emergingSkills: emergingSkills || '',
    timeline: timeline || '6 months',
    urgency: urgency || 'Medium',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  consultations.push(consultation);
  res.status(201).json(consultation);
});

app.get('/api/consultations', async (req, res) => {
  res.json(consultations);
});

app.get('/api/surveys/stats', async (req, res) => {
  try {
    const surveys = await prisma.employerSurvey.findMany();
    const total = surveys.length;
    const avgSatisfaction = total > 0
      ? (surveys.reduce((sum, s) => sum + s.satisfactionScore, 0) / total).toFixed(1)
      : 0;

    // Aggregate skills needed
    const skillCounts: Record<string, number> = {};
    surveys.forEach(s => {
      s.skillsNeeded.split(',').forEach(skill => {
        const trimmed = skill.trim().toLowerCase();
        if (trimmed) skillCounts[trimmed] = (skillCounts[trimmed] || 0) + 1;
      });
    });
    const topNeededSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Quality distribution
    const qualityDist: Record<string, number> = {};
    surveys.forEach(s => {
      qualityDist[s.candidateQuality] = (qualityDist[s.candidateQuality] || 0) + 1;
    });

    res.json({ total, avgSatisfaction, topNeededSkills, qualityDistribution: qualityDist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PLACEMENT TRACKING ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Single correct placement route — accepts studentEmail + companyName from College Dashboard
app.post('/api/placements', authenticate, async (req: any, res: any) => {
  if (req.user?.role !== 'COLLEGE' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only colleges or admins can submit placement data' });
  }
  const { studentEmail, companyName, jobRole, package: pkg, location } = req.body;
  if (!studentEmail || !companyName || !jobRole) {
    return res.status(400).json({ message: 'studentEmail, companyName, and jobRole are required' });
  }
  try {
    // Find or create student by email
    let student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student) {
      const hp = await bcrypt.hash('password123', 10);
      student = await prisma.user.create({
        data: { name: studentEmail.split('@')[0], email: studentEmail, password: hp, role: 'STUDENT' }
      });
    }
    // Find or create company by name
    let company = await prisma.user.findFirst({ where: { name: companyName, role: 'COMPANY' } });
    if (!company) {
      const hp = await bcrypt.hash('password123', 10);
      company = await prisma.user.create({
        data: { name: companyName, email: `${companyName.replace(/\s+/g, '').toLowerCase()}@company.com`, password: hp, role: 'COMPANY' }
      });
    }
    const placement = await prisma.placementRecord.create({
      data: {
        jobRole,
        package: pkg || '',
        location: location || '',
        isPlaced: true,
        studentId: student.id,
        companyId: company.id
      }
    });
    res.status(201).json({ ...placement, studentName: student.name, companyName: company.name });
  } catch (error) {
    console.error('Placement Error:', error);
    res.status(500).json({ message: 'Server error adding placement' });
  }
});

app.get('/api/career-pathways', async (req, res) => {
  try {
    const jobs = await prisma.jobPosting.findMany();
    const roleStats: Record<string, { count: number, salaries: number[], skills: Record<string, number> }> = {};

    jobs.forEach(job => {
      const role = job.title;
      if (!roleStats[role]) roleStats[role] = { count: 0, salaries: [], skills: {} };
      roleStats[role].count++;
      
      // Parse salary e.g. "6-10 LPA" -> 8
      const match = job.salaryRange.match(/(\d+)/g);
      if (match && match.length > 0) {
        const avg = match.reduce((a, b) => a + parseInt(b), 0) / match.length;
        roleStats[role].salaries.push(avg);
      }

      job.requirements.split(',').forEach(s => {
        const skill = s.trim();
        if (skill) roleStats[role].skills[skill] = (roleStats[role].skills[skill] || 0) + 1;
      });
    });

    const pathways = Object.entries(roleStats)
      .filter(([_, stats]) => stats.count > 0)
      .map(([title, stats]) => {
        const avgSalary = stats.salaries.length > 0 
          ? `${Math.round(stats.salaries.reduce((a, b) => a + b, 0) / stats.salaries.length)} LPA Avg` 
          : 'Competitive';
        
        const topSkills = Object.entries(stats.skills)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(s => s[0]);

        return {
          title,
          demand: stats.count > 2 ? 'Very High' : 'High',
          salary: avgSalary,
          skills: topSkills,
          emoji: title.toLowerCase().includes('data') ? '📊' : title.toLowerCase().includes('cloud') ? '☁️' : '💻'
        };
      })
      .sort((a, b) => (b.demand === 'Very High' ? 1 : 0) - (a.demand === 'Very High' ? 1 : 0));

    res.json(pathways);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/placements', async (req, res) => {
  try {
    const placements = await prisma.placementRecord.findMany({
      include: {
        student: { select: { name: true } },
        company: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(placements);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/placements/stats', async (req, res) => {
  try {
    const placements = await prisma.placementRecord.findMany();
    const totalPlaced = placements.filter(p => p.isPlaced).length;
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });

    // Location-wise breakdown
    const locationDist: Record<string, number> = {};
    placements.forEach(p => {
      const loc = p.location || 'Unknown';
      locationDist[loc] = (locationDist[loc] || 0) + 1;
    });

    // Role-wise breakdown
    const roleDist: Record<string, number> = {};
    placements.forEach(p => {
      roleDist[p.jobRole] = (roleDist[p.jobRole] || 0) + 1;
    });

    res.json({
      totalPlaced,
      totalStudents,
      placementRate: totalStudents > 0 ? ((totalPlaced / totalStudents) * 100).toFixed(1) : 0,
      locationDistribution: locationDist,
      roleDistribution: roleDist
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL TAXONOMY & TRENDS (Proxy to ML Engine)
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/skills/taxonomy', async (req, res) => {
  try {
    const response = await axios.get(`${ML_ENGINE_URL}/taxonomy`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'ML Engine unavailable' });
  }
});

app.get('/api/skills/trends', async (req, res) => {
  try {
    const response = await axios.get(`${ML_ENGINE_URL}/trends`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'ML Engine unavailable' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING PLAN ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/training-plans', async (req: any, res: any) => {
  const { district, targetSkills } = req.body;
  try {
    const mlResponse = await axios.post(`${ML_ENGINE_URL}/generate-training-plan`, {
      district, targetSkills
    });
    const plan = mlResponse.data;

    // Store equipment + oversupply as JSON so frontend can parse both
    const equipmentJson = JSON.stringify({
      equipment: plan.equipment_needed,
      oversupplied: plan.oversupplied_skills || []
    });

    const saved = await prisma.trainingPlan.create({
      data: {
        district,
        targetSkills: targetSkills.join(', '),
        recommendedCourses: JSON.stringify(plan.recommended_courses),
        trainerRequirements: plan.trainer_requirements.join(', '),
        equipmentNeeded: equipmentJson,
        timeline: plan.estimated_timeline
      }
    });

    res.json({ ...saved, details: plan });
  } catch (error) {
    console.error("Training Plan Error:", error);
    res.status(500).json({ message: 'Server error generating training plan. Is the ML engine running?' });
  }
});

app.get('/api/training-plans', async (req, res) => {
  try {
    const plans = await prisma.trainingPlan.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalJobs, totalReports, totalPlacements, totalSurveys, totalPlans] = await Promise.all([
      prisma.user.count(),
      prisma.jobPosting.count(),
      prisma.gapReport.count(),
      prisma.placementRecord.count(),
      prisma.employerSurvey.count(),
      prisma.trainingPlan.count()
    ]);

    const roleBreakdown = {
      students: await prisma.user.count({ where: { role: 'STUDENT' } }),
      colleges: await prisma.user.count({ where: { role: 'COLLEGE' } }),
      companies: await prisma.user.count({ where: { role: 'COMPANY' } })
    };

    // Average alignment score
    const reports = await prisma.gapReport.findMany({ select: { overallScore: true } });
    const avgAlignment = reports.length > 0
      ? (reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length).toFixed(1)
      : 0;

    // Top missing skills across all reports
    const allReports = await prisma.gapReport.findMany({ select: { missingSkills: true } });
    const skillFreq: Record<string, number> = {};
    allReports.forEach(r => {
      r.missingSkills.split(',').forEach(s => {
        const trimmed = s.trim().toLowerCase();
        if (trimmed) skillFreq[trimmed] = (skillFreq[trimmed] || 0) + 1;
      });
    });
    const topMissingSkills = Object.entries(skillFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Sector growth breakdown — aggregate job postings by sector
    const allJobs = await prisma.jobPosting.findMany({ select: { sector: true, proficiencyLevel: true } });
    const sectorCounts: Record<string, number> = {};
    const proficiencyCounts: Record<string, number> = {};
    allJobs.forEach(j => {
      sectorCounts[j.sector] = (sectorCounts[j.sector] || 0) + 1;
      proficiencyCounts[j.proficiencyLevel] = (proficiencyCounts[j.proficiencyLevel] || 0) + 1;
    });
    const sectorGrowth = Object.entries(sectorCounts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count);
    const proficiencyDemand = Object.entries(proficiencyCounts)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count);

    // Count employer validations
    const allGapReports = await prisma.gapReport.findMany({ select: { demandAnalysis: true } });
    let validatedCount = 0, revisedCount = 0;
    allGapReports.forEach(r => {
      try {
        const d = JSON.parse(r.demandAnalysis || '{}');
        if (d.validationStatus === 'Employer Validated') validatedCount++;
        if (d.revisionStatus === 'Revised') revisedCount++;
      } catch(e) {}
    });

    res.json({
      totalUsers, totalJobs, totalReports, totalPlacements, totalSurveys, totalPlans,
      roleBreakdown, avgAlignment, topMissingSkills,
      sectorGrowth, proficiencyDemand, validatedCount, revisedCount
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/analytics/district/:district', async (req, res) => {
  const { district } = req.params;
  try {
    const jobs = await prisma.jobPosting.findMany({
      where: district !== 'all' ? { location: { contains: district } } : {}
    });

    // Send to ML engine for district analysis
    const mlResponse = await axios.post(`${ML_ENGINE_URL}/district-analysis`, {
      district,
      jobs: jobs.map(j => ({ requirements: j.requirements, location: j.location }))
    });

    res.json(mlResponse.data);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SEED ENDPOINT (for demo data)
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/seed', async (req, res) => {
  try {
    // Create demo companies
    const hp = await bcrypt.hash('demo123', 10);
    const company1 = await prisma.user.upsert({
      where: { email: 'tcs@demo.com' },
      update: {},
      create: { name: 'TCS', email: 'tcs@demo.com', password: hp, role: 'COMPANY', location: 'Mumbai', organization: 'Tata Consultancy Services' }
    });
    const company2 = await prisma.user.upsert({
      where: { email: 'infosys@demo.com' },
      update: {},
      create: { name: 'Infosys', email: 'infosys@demo.com', password: hp, role: 'COMPANY', location: 'Bangalore', organization: 'Infosys Ltd' }
    });
    const company3 = await prisma.user.upsert({
      where: { email: 'wipro@demo.com' },
      update: {},
      create: { name: 'Wipro', email: 'wipro@demo.com', password: hp, role: 'COMPANY', location: 'Hyderabad', organization: 'Wipro Technologies' }
    });

    // Create demo admin
    await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: { name: 'Super Admin', email: 'admin@demo.com', password: hp, role: 'ADMIN', location: 'HQ', organization: 'System Admin' }
    });

    // Create demo college
    await prisma.user.upsert({
      where: { email: 'jiet@demo.com' },
      update: {},
      create: { name: 'JIET College', email: 'jiet@demo.com', password: hp, role: 'COLLEGE', location: 'Jodhpur', organization: 'JIET Universe' }
    });

    // Create demo student
    await prisma.user.upsert({
      where: { email: 'student@demo.com' },
      update: {},
      create: { name: 'Demo Student', email: 'student@demo.com', password: hp, role: 'STUDENT', location: 'Jodhpur' }
    });

    // Create demo jobs
    const jobsData = [
      { title: 'Full Stack Developer', description: 'Build web applications', requirements: 'React, Node.js, MongoDB, Docker, AWS, Git, REST API, TypeScript', sector: 'IT', location: 'Mumbai', proficiencyLevel: 'Intermediate', salaryRange: '6-10 LPA', companyId: company1.id },
      { title: 'Data Scientist', description: 'Analyze large datasets', requirements: 'Python, Machine Learning, Deep Learning, TensorFlow, Pandas, SQL, Data Visualization, NLP', sector: 'IT', location: 'Bangalore', proficiencyLevel: 'Advanced', salaryRange: '10-18 LPA', companyId: company2.id },
      { title: 'Cloud Engineer', description: 'Manage cloud infrastructure', requirements: 'AWS, Azure, Docker, Kubernetes, Terraform, Linux, CI/CD, Microservices', sector: 'IT', location: 'Hyderabad', proficiencyLevel: 'Intermediate', salaryRange: '8-15 LPA', companyId: company3.id },
      { title: 'Frontend Developer', description: 'Build responsive UIs', requirements: 'React, JavaScript, TypeScript, HTML, CSS, Tailwind CSS, Next.js, Git', sector: 'IT', location: 'Mumbai', proficiencyLevel: 'Beginner', salaryRange: '4-8 LPA', companyId: company1.id },
      { title: 'DevOps Engineer', description: 'Automate deployment pipelines', requirements: 'Docker, Kubernetes, Jenkins, Terraform, AWS, Linux, Git, CI/CD, Ansible', sector: 'IT', location: 'Pune', proficiencyLevel: 'Intermediate', salaryRange: '8-14 LPA', companyId: company2.id },
      { title: 'Cybersecurity Analyst', description: 'Protect digital assets', requirements: 'Cybersecurity, Network Security, Ethical Hacking, Penetration Testing, Linux, Python, OWASP', sector: 'IT', location: 'Delhi', proficiencyLevel: 'Intermediate', salaryRange: '6-12 LPA', companyId: company3.id },
    ];
    for (const job of jobsData) {
      await prisma.jobPosting.create({ data: job }).catch(() => {});
    }

    // Create demo surveys
    const surveysData = [
      { satisfactionScore: 3, feedbackText: 'Students lack practical coding skills', skillsNeeded: 'React, Docker, AWS, Git', hiringDistrict: 'Mumbai', candidateQuality: 'Below Average', companyId: company1.id },
      { satisfactionScore: 2, feedbackText: 'Need more ML/AI trained candidates', skillsNeeded: 'Machine Learning, Python, TensorFlow, Data Analysis', hiringDistrict: 'Bangalore', candidateQuality: 'Average', companyId: company2.id },
      { satisfactionScore: 4, feedbackText: 'Good fundamentals but weak in cloud', skillsNeeded: 'AWS, Kubernetes, DevOps', hiringDistrict: 'Hyderabad', candidateQuality: 'Good', companyId: company3.id },
    ];
    for (const survey of surveysData) {
      await prisma.employerSurvey.create({ data: survey }).catch(() => {});
    }

    res.json({ message: 'Demo data seeded successfully!' });
  } catch (error) {
    console.error("Seed Error:", error);
    res.status(500).json({ message: 'Seed error', error });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`ML Engine expected at ${ML_ENGINE_URL}`);
});
