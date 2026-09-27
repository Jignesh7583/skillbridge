import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

/**
 * Intelligent Job Matching Helper
 * Matches jobs against the target role first using exact title, substring match,
 * and semantic role synonyms. Then refines by district if available, without ever falling
 * back to completely unrelated roles in that district.
 */
function findRelevantJobs(allJobs: any[], targetRole?: string | null, district?: string | null): any[] {
  if (!allJobs || allJobs.length === 0) return [];

  const roleSynonyms: Record<string, string[]> = {
    'web': ['web developer', 'frontend', 'front-end', 'full stack', 'fullstack', 'react', 'node', 'ui developer', 'software developer', 'mern'],
    'frontend': ['frontend', 'front-end', 'ui developer', 'web developer', 'react developer'],
    'full stack': ['full stack', 'fullstack', 'mern', 'web developer', 'software developer', 'software engineer'],
    'backend': ['backend', 'back-end', 'node.js', 'java developer', 'python developer', 'software engineer', 'full stack'],
    'data analyst': ['data analyst', 'junior data analyst', 'bi analyst', 'business analyst', 'analytics'],
    'data scientist': ['data scientist', 'machine learning', 'ai engineer', 'ml engineer', 'deep learning'],
    'cloud': ['cloud', 'devops', 'cloud devops engineer', 'aws', 'azure', 'infrastructure', 'sre'],
    'devops': ['devops', 'cloud devops engineer', 'cloud', 'sre', 'ci/cd', 'docker'],
    'cybersecurity': ['cybersecurity', 'security', 'ethical hacking', 'network security', 'infosec'],
    'mobile': ['mobile', 'android', 'ios', 'flutter', 'react native', 'app developer'],
    'software': ['software engineer', 'software developer', 'full stack', 'backend', 'web developer']
  };

  let roleCandidates = allJobs;

  if (targetRole && targetRole.trim() && targetRole.toLowerCase() !== 'all') {
    const roleClean = targetRole.trim().toLowerCase();

    // Priority 1: Exact title match
    const exact = allJobs.filter(j => j.title.toLowerCase() === roleClean);
    if (exact.length > 0) {
      roleCandidates = exact;
    } else {
      // Priority 2: Substring match
      const sub = allJobs.filter(j => 
        j.title.toLowerCase().includes(roleClean) || roleClean.includes(j.title.toLowerCase())
      );
      if (sub.length > 0) {
        roleCandidates = sub;
      } else {
        // Priority 3: Semantic role cluster match
        const matchingClusterKey = Object.keys(roleSynonyms).find(k => roleClean.includes(k) || k.includes(roleClean));
        if (matchingClusterKey) {
          const synonyms = roleSynonyms[matchingClusterKey];
          const synMatches = allJobs.filter(j => {
            const t = j.title.toLowerCase();
            return synonyms.some(syn => t.includes(syn));
          });
          if (synMatches.length > 0) {
            roleCandidates = synMatches;
          }
        }
      }
    }
  }

  // Refine by district if requested
  if (district && district.trim() && district.toLowerCase() !== 'all') {
    const distClean = district.trim().toLowerCase();
    const inDistrict = roleCandidates.filter(j => j.location.toLowerCase().includes(distClean));
    if (inDistrict.length > 0) {
      return inDistrict;
    }
    // If not found in requested district, DO NOT fall back to unrelated jobs!
    // Keep roleCandidates so gap analysis accurately evaluates the requested career role.
    return roleCandidates;
  }

  return roleCandidates;
}

app.post('/api/syllabus', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'COLLEGE') return res.status(403).json({ message: 'Only colleges can upload syllabus' });
  const { branch, semester, subjects, content, university, lastUpdated, targetRole, district } = req.body;
  try {
    const syllabus = await prisma.syllabus.create({
      data: {
        branch, semester, subjects: subjects || 'Various', content,
        university: university || '',
        lastUpdated: lastUpdated || '2024',
        collegeId: req.user.id
      }
    });

    // Fetch matching job requirements for targeted gap analysis
    const allJobs = await prisma.jobPosting.findMany();
    const relevantJobs = findRelevantJobs(allJobs, targetRole, district);
    const allJobRequirements = relevantJobs.map(j => `${j.title}: ${j.requirements}`).join('. ');

    // Call Python ML Microservice
    try {
      const mlResponse = await axios.post(`${ML_ENGINE_URL}/analyze`, {
        syllabusText: content,
        jobText: allJobRequirements
      });

      const mlData = mlResponse.data;
      const demandData = {
        ...(mlData.demand_analysis || {}),
        targetRole: targetRole || 'All',
        targetDistrict: district || 'All',
        analyzedJobCount: relevantJobs.length
      };

      const gapReport = await prisma.gapReport.create({
        data: {
          missingSkills: (mlData.missing_skills || []).join(', '),
          matchedSkills: (mlData.matched_skills || []).join(', '),
          obsoleteSkills: (mlData.obsolete_skills || []).join(', '),
          recommendations: JSON.stringify(mlData.recommendations || []),
          overallScore: mlData.alignment_score || 0,
          demandAnalysis: JSON.stringify(demandData),
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

    const companyUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    const companyDisplayName = companyUser?.name || companyUser?.organization || 'Employer Partner';

    // Store validation info in demandAnalysis JSON field
    let demandData: any = {};
    try { demandData = JSON.parse(report.demandAnalysis || '{}'); } catch(e) {}
    const validations: any[] = demandData.validations || [];
    validations.push({
      companyId: req.user.id,
      companyName: companyDisplayName,
      action,
      note: note || (action === 'validate' ? 'Verified — skills gap matches active hiring requirements.' : 'Disputed — skills gap does not match our current requirements.'),
      timestamp: new Date().toISOString()
    });
    demandData.validations = validations;
    demandData.validationStatus = action === 'validate' ? 'Employer Validated' : 'Employer Disputed';
    demandData.lastValidatedBy = companyDisplayName;
    demandData.lastValidationNote = note || '';

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

// College updates curriculum and re-analyzes to observe score improvement (Closed-Loop)
app.post('/api/reports/:id/reanalyze', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'COLLEGE') return res.status(403).json({ message: 'Only colleges can re-analyze reports' });
  const { id } = req.params;
  const { updatedContent, newTopics } = req.body;
  try {
    const report = await prisma.gapReport.findUnique({
      where: { id },
      include: { syllabus: true }
    });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const previousScore = report.overallScore;
    const newContent = updatedContent || `${report.syllabus.content}\n\nRevised Modules Added: ${newTopics || ''}`;

    // Update syllabus content
    await prisma.syllabus.update({
      where: { id: report.syllabusId },
      data: {
        content: newContent,
        lastUpdated: new Date().getFullYear().toString()
      }
    });

    // Determine target jobs
    let demandData: any = {};
    try { demandData = JSON.parse(report.demandAnalysis || '{}'); } catch(e) {}
    const targetRole = demandData.targetRole || null;
    const targetDistrict = demandData.district || demandData.targetDistrict || null;

    const jobs = await prisma.jobPosting.findMany();
    const relevantJobs = findRelevantJobs(jobs, targetRole, targetDistrict);
    const allJobRequirements = relevantJobs.map(j => `${j.title}: ${j.requirements}`).join('. ');

    // Call ML Engine
    const mlResponse = await axios.post(`${ML_ENGINE_URL}/analyze`, {
      syllabusText: newContent,
      jobText: allJobRequirements
    });
    const mlData = mlResponse.data;

    demandData = {
      ...demandData,
      ...(mlData.demand_analysis || {}),
      previousScore,
      newScore: mlData.alignment_score,
      scoreImprovement: mlData.alignment_score - previousScore,
      revisionStatus: 'Revised',
      revisedAt: new Date().toISOString(),
      revisedBy: req.user.id,
      addedContent: newTopics || 'Updated Modules'
    };

    const updated = await prisma.gapReport.update({
      where: { id },
      data: {
        missingSkills: (mlData.missing_skills || []).join(', '),
        matchedSkills: (mlData.matched_skills || []).join(', '),
        obsoleteSkills: (mlData.obsolete_skills || []).join(', '),
        recommendations: JSON.stringify(mlData.recommendations || []),
        overallScore: mlData.alignment_score || 0,
        demandAnalysis: JSON.stringify(demandData)
      },
      include: {
        college: { select: { name: true, location: true } },
        syllabus: { select: { branch: true, semester: true, university: true, content: true } }
      }
    });

    res.json({
      message: `Curriculum updated and re-analyzed! Alignment score improved from ${previousScore}% to ${mlData.alignment_score}%.`,
      report: updated,
      previousScore,
      newScore: mlData.alignment_score,
      improvement: mlData.alignment_score - previousScore
    });
  } catch (error) {
    console.error('Re-analyze Error:', error);
    res.status(500).json({ message: 'Server error re-analyzing curriculum' });
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

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONALIZED STUDENT EVALUATION & CAREER GUIDANCE
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/student/evaluate', async (req, res) => {
  const { skills, district, targetRole } = req.body;
  if (!skills) return res.status(400).json({ message: 'Skills input is required' });

  try {
    const allJobs = await prisma.jobPosting.findMany({
      include: { company: { select: { name: true } } }
    });

    // Group jobs by role title
    const roleMap: Record<string, { jobs: any[], requirements: string[] }> = {};
    allJobs.forEach(j => {
      const role = j.title;
      if (!roleMap[role]) roleMap[role] = { jobs: [], requirements: [] };
      roleMap[role].jobs.push(j);
      j.requirements.split(',').forEach(s => {
        const tr = s.trim().toLowerCase();
        if (tr && !roleMap[role].requirements.includes(tr)) roleMap[role].requirements.push(tr);
      });
    });

    // Evaluate student skills against all available roles
    const suitableRoles: any[] = [];
    for (const [roleTitle, data] of Object.entries(roleMap)) {
      const jobText = data.requirements.join(', ');
      try {
        const mlRes = await axios.post(`${ML_ENGINE_URL}/analyze`, {
          syllabusText: skills,
          jobText
        });
        const ml = mlRes.data;
        const matchingVacancies = data.jobs.filter(j => !district || district === 'All' || j.location.toLowerCase().includes(district.toLowerCase()));

        suitableRoles.push({
          role: roleTitle,
          matchPercentage: ml.alignment_score,
          matchedSkills: ml.matched_skills,
          missingSkills: ml.missing_skills,
          totalRoleSkills: ml.total_job_skills,
          vacancies: matchingVacancies.length,
          avgSalary: data.jobs[0]?.salaryRange || 'Competitive',
          location: matchingVacancies[0]?.location || data.jobs[0]?.location || 'Various',
          companies: [...new Set(data.jobs.map(j => j.company.name))]
        });
      } catch(e) {}
    }

    // Sort suitable roles by match percentage descending
    suitableRoles.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Pick top matching role or user's targetRole
    let primaryTarget = suitableRoles[0];
    if (targetRole && targetRole !== 'All') {
      const matchedTarget = suitableRoles.find(r => r.role.toLowerCase() === targetRole.toLowerCase());
      if (matchedTarget) primaryTarget = matchedTarget;
    }

    // Get recommendations for missing skills of the primary target
    let recommendations: any[] = [];
    if (primaryTarget?.missingSkills && primaryTarget.missingSkills.length > 0) {
      const mlRecRes = await axios.post(`${ML_ENGINE_URL}/analyze`, {
        syllabusText: '',
        jobText: primaryTarget.missingSkills.join(', ')
      });
      recommendations = mlRecRes.data.recommendations || [];
    }

    // Dynamic career pathway milestones tailored to target role
    const targetTitle = primaryTarget?.role || 'Data Analyst';
    const pathwayMilestones = targetTitle.toLowerCase().includes('data') ? [
      { level: 'Entry Level (0-1 yr)', title: 'Associate Data Analyst', salary: '5-7 LPA', focus: 'Excel, Basic SQL' },
      { level: 'Mid Level (1-3 yrs)', title: 'BI & Analytics Engineer', salary: '8-12 LPA', focus: 'Power BI, Python, Business Analytics' },
      { level: 'Senior Level (3-5+ yrs)', title: 'Lead Data Strategist', salary: '14-22 LPA', focus: 'Applied Statistics, Predictive Modeling, Machine Learning' }
    ] : targetTitle.toLowerCase().includes('cloud') || targetTitle.toLowerCase().includes('devops') ? [
      { level: 'Entry Level (0-1 yr)', title: 'Junior Cloud/DevOps Associate', salary: '6-8 LPA', focus: 'Linux, Git, Basic Docker' },
      { level: 'Mid Level (1-3 yrs)', title: 'Cloud Infrastructure Engineer', salary: '9-15 LPA', focus: 'AWS, Kubernetes, Terraform, CI/CD' },
      { level: 'Senior Level (3-5+ yrs)', title: 'Principal Solutions Architect', salary: '18-28 LPA', focus: 'System Design, Microservices, Security' }
    ] : [
      { level: 'Entry Level (0-1 yr)', title: 'Junior Developer', salary: '5-8 LPA', focus: 'HTML, CSS, JavaScript, Git' },
      { level: 'Mid Level (1-3 yrs)', title: 'Full Stack Engineer', salary: '8-14 LPA', focus: 'React, Node.js, Databases, REST APIs' },
      { level: 'Senior Level (3-5+ yrs)', title: 'Staff Software Engineer', salary: '16-25 LPA', focus: 'Architecture, Distributed Systems, Cloud' }
    ];

    // Local demand summary for the district
    const districtFilter = district && district !== 'All' ? district : 'Jaipur';
    const localJobs = allJobs.filter(j => j.location.toLowerCase().includes(districtFilter.toLowerCase()));

    res.json({
      primaryTarget,
      suitableRoles: suitableRoles.slice(0, 5),
      missingSkills: primaryTarget?.missingSkills || [],
      matchedSkills: primaryTarget?.matchedSkills || [],
      alignmentScore: primaryTarget?.matchPercentage || 0,
      recommendations,
      careerPathway: {
        role: targetTitle,
        milestones: pathwayMilestones
      },
      localDemand: {
        district: districtFilter,
        activeRequisitions: localJobs.length,
        companiesHiring: [...new Set(localJobs.map(j => j.company.name))],
        salaryRange: localJobs.find(j => j.title.toLowerCase().includes(targetTitle.toLowerCase()))?.salaryRange || '6-9 LPA'
      }
    });
  } catch (error) {
    console.error('Student Evaluation Error:', error);
    res.status(500).json({ message: 'Server error evaluating student skills' });
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

    // Role breakdown
    const roleBreakdown = {
      students: await prisma.user.count({ where: { role: 'STUDENT' } }),
      colleges: await prisma.user.count({ where: { role: 'COLLEGE' } }),
      companies: await prisma.user.count({ where: { role: 'COMPANY' } })
    };

    // 1. Top Demanded Roles
    const allJobsWithDetails = await prisma.jobPosting.findMany({
      include: { company: { select: { name: true, organization: true } } }
    });
    const roleCountMap: Record<string, { count: number; locations: Set<string>; sectors: Set<string> }> = {};
    const skillCountMap: Record<string, number> = {};
    const districtJobMap: Record<string, { count: number; skills: Record<string, number>; roles: Record<string, number> }> = {};

    allJobsWithDetails.forEach(j => {
      // Role demand
      const role = j.title.trim();
      if (!roleCountMap[role]) roleCountMap[role] = { count: 0, locations: new Set(), sectors: new Set() };
      roleCountMap[role].count++;
      if (j.location) roleCountMap[role].locations.add(j.location);
      if (j.sector) roleCountMap[role].sectors.add(j.sector);

      // Skills demand
      j.requirements.split(',').forEach(s => {
        const sk = s.trim().toLowerCase();
        if (sk) {
          skillCountMap[sk] = (skillCountMap[sk] || 0) + 1;
        }
      });

      // District demand
      const dist = j.location.trim() || 'General';
      if (!districtJobMap[dist]) districtJobMap[dist] = { count: 0, skills: {}, roles: {} };
      districtJobMap[dist].count++;
      districtJobMap[dist].roles[role] = (districtJobMap[dist].roles[role] || 0) + 1;
      j.requirements.split(',').forEach(s => {
        const sk = s.trim().toLowerCase();
        if (sk) {
          districtJobMap[dist].skills[sk] = (districtJobMap[dist].skills[sk] || 0) + 1;
        }
      });
    });

    const topDemandedRoles = Object.entries(roleCountMap)
      .map(([role, data]) => ({
        role,
        count: data.count,
        locations: Array.from(data.locations),
        sectors: Array.from(data.sectors)
      }))
      .sort((a, b) => b.count - a.count);

    // 2. Top Demanded Skills
    const topDemandedSkills = Object.entries(skillCountMap)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // 3. Skill Gaps (from Gap Reports)
    const allGapReports = await prisma.gapReport.findMany({
      include: {
        college: { select: { name: true, organization: true, location: true } },
        syllabus: { select: { branch: true, semester: true, subjects: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const missingSkillFreq: Record<string, number> = {};
    let validatedCount = 0;
    let revisedCount = 0;
    let totalScore = 0;
    const scoreDistribution = { critical: 0, moderate: 0, aligned: 0 };
    const validationAudit: any[] = [];

    allGapReports.forEach(r => {
      totalScore += r.overallScore;
      if (r.overallScore < 50) scoreDistribution.critical++;
      else if (r.overallScore <= 75) scoreDistribution.moderate++;
      else scoreDistribution.aligned++;

      r.missingSkills.split(',').forEach(s => {
        const trimmed = s.trim().toLowerCase();
        if (trimmed) missingSkillFreq[trimmed] = (missingSkillFreq[trimmed] || 0) + 1;
      });

      try {
        const d = JSON.parse(r.demandAnalysis || '{}');
        if (d.validationStatus === 'Employer Validated') {
          validatedCount++;
          validationAudit.push({
            reportId: r.id,
            collegeName: r.college.organization || r.college.name,
            district: d.district || r.college.location,
            targetRole: d.targetRole || r.syllabus.branch,
            validatedBy: d.validatedBy || 'Industry Partner',
            comment: d.validationComment || 'Curriculum gap verified by hiring team',
            validatedAt: d.validatedAt || r.createdAt,
            score: r.overallScore,
            status: 'Employer Validated'
          });
        }
        if (d.revisionStatus === 'Revised') revisedCount++;
      } catch (e) {}
    });

    const topMissingSkills = Object.entries(missingSkillFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));

    // 4. Curriculum Alignment overview
    const avgAlignment = allGapReports.length > 0
      ? (totalScore / allGapReports.length).toFixed(1)
      : 0;

    const curriculumAlignment = {
      averageScore: Number(avgAlignment),
      distribution: scoreDistribution,
      totalAudited: allGapReports.length,
      recentReports: allGapReports.slice(0, 8).map(r => {
        let meta: any = {};
        try { meta = JSON.parse(r.demandAnalysis || '{}'); } catch(e) {}
        return {
          id: r.id,
          college: r.college.organization || r.college.name,
          location: r.college.location,
          branch: r.syllabus.branch,
          overallScore: r.overallScore,
          matchedSkills: r.matchedSkills,
          missingSkills: r.missingSkills,
          targetRole: meta.targetRole || 'Industry Standard',
          validationStatus: meta.validationStatus || 'Pending',
          revisionStatus: meta.revisionStatus || 'Initial',
          scoreImprovement: meta.scoreImprovement || null,
          createdAt: r.createdAt
        };
      })
    };

    // 5. District-wise demand
    const districtDemand = Object.entries(districtJobMap).map(([district, data]) => {
      const sortedSkills = Object.entries(data.skills)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([s]) => s);
      const topRole = Object.entries(data.roles)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Software Engineer';
      return {
        district,
        jobCount: data.count,
        topRole,
        topSkills: sortedSkills
      };
    }).sort((a, b) => b.jobCount - a.jobCount);

    // 6. Placement Outcomes
    const recentPlacements = await prisma.placementRecord.findMany({
      include: {
        student: { select: { name: true, location: true } },
        company: { select: { name: true, organization: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 7. Training Recommendations
    const trainingPlans = await prisma.trainingPlan.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const parsedTrainingRecommendations = trainingPlans.map(tp => {
      let courses = [];
      try { courses = JSON.parse(tp.recommendedCourses || '[]'); } catch(e) { courses = [tp.recommendedCourses]; }
      return {
        id: tp.id,
        district: tp.district,
        targetSkills: tp.targetSkills,
        courses,
        trainerRequirements: tp.trainerRequirements,
        equipmentNeeded: tp.equipmentNeeded,
        timeline: tp.timeline,
        status: tp.status
      };
    });

    // 8. Trainer & Equipment Gaps Aggregation
    const trainerEquipmentGaps = {
      trainers: trainingPlans.map(tp => ({
        district: tp.district,
        requirement: tp.trainerRequirements,
        status: tp.status
      })).filter(t => t.requirement),
      equipment: trainingPlans.map(tp => ({
        district: tp.district,
        needed: tp.equipmentNeeded,
        status: tp.status
      })).filter(e => e.needed)
    };

    // 9. Employer Validation Stats
    const employerValidationStats = {
      totalSurveys,
      totalReports: allGapReports.length,
      validatedCount,
      revisedCount,
      pendingValidation: Math.max(0, allGapReports.length - validatedCount),
      auditTrail: validationAudit
    };

    res.json({
      totalUsers,
      totalJobs,
      totalReports,
      totalPlacements,
      totalSurveys,
      totalPlans,
      roleBreakdown,
      avgAlignment,
      topDemandedRoles,
      topDemandedSkills,
      topMissingSkills,
      curriculumAlignment,
      districtDemand,
      placementOutcomes: {
        total: totalPlacements,
        recent: recentPlacements.map(p => ({
          id: p.id,
          studentName: p.student.name,
          studentLocation: p.student.location,
          companyName: p.company.organization || p.company.name,
          role: p.jobRole,
          package: p.package,
          district: p.location || p.student.location
        }))
      },
      trainingRecommendations: parsedTrainingRecommendations,
      trainerEquipmentGaps,
      employerValidationStats
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
// SEED ENDPOINT (for SIH Demo Scenario: Jaipur -> Data Analyst)
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/seed', async (req, res) => {
  try {
    const hp = await bcrypt.hash('demo123', 10);

    // 1. Seed Demo Companies (including TCS Jaipur for the required demo)
    const tcs = await prisma.user.upsert({
      where: { email: 'tcs@demo.com' },
      update: { organization: 'Tata Consultancy Services', location: 'Jaipur' },
      create: { name: 'TCS Jaipur', email: 'tcs@demo.com', password: hp, role: 'COMPANY', location: 'Jaipur', organization: 'Tata Consultancy Services' }
    });

    const infosys = await prisma.user.upsert({
      where: { email: 'infosys@demo.com' },
      update: {},
      create: { name: 'Infosys Ltd', email: 'infosys@demo.com', password: hp, role: 'COMPANY', location: 'Bangalore', organization: 'Infosys Ltd' }
    });

    const wipro = await prisma.user.upsert({
      where: { email: 'wipro@demo.com' },
      update: {},
      create: { name: 'Wipro Technologies', email: 'wipro@demo.com', password: hp, role: 'COMPANY', location: 'Hyderabad', organization: 'Wipro Technologies' }
    });

    // 2. Demo Admin (Govt / Technical Education Directorate)
    await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: { organization: 'Directorate of Technical Education, Rajasthan' },
      create: { name: 'Govt Admin Officer', email: 'admin@demo.com', password: hp, role: 'ADMIN', location: 'Jaipur', organization: 'Directorate of Technical Education, Rajasthan' }
    });

    // 3. Demo College (Jaipur Engineering College & Research Centre)
    const college = await prisma.user.upsert({
      where: { email: 'jiet@demo.com' },
      update: { organization: 'Jaipur Engineering College (JECRC)', location: 'Jaipur' },
      create: { name: 'JECRC College', email: 'jiet@demo.com', password: hp, role: 'COLLEGE', location: 'Jaipur', organization: 'Jaipur Engineering College (JECRC)' }
    });

    // 4. Demo Student (Pooja Verma - Jaipur)
    const student = await prisma.user.upsert({
      where: { email: 'student@demo.com' },
      update: { location: 'Jaipur', organization: 'JECRC - B.Tech Data Analytics' },
      create: { name: 'Pooja Verma', email: 'student@demo.com', password: hp, role: 'STUDENT', location: 'Jaipur', organization: 'JECRC - B.Tech Data Analytics' }
    });

    // 5. Demo Job Postings (Crucial: Jaipur -> Data Analyst with SQL, Power BI, Python, Excel, Statistics)
    // Check if Jaipur Data Analyst job exists
    const existingJaipurJob = await prisma.jobPosting.findFirst({
      where: { location: 'Jaipur', title: 'Data Analyst' }
    });

    if (!existingJaipurJob) {
      await prisma.jobPosting.create({
        data: {
          title: 'Data Analyst',
          description: 'Analyze enterprise datasets, build Power BI reports, and execute statistical data pipelines in Python and SQL.',
          requirements: 'SQL, Power BI, Python, Excel, Statistics',
          sector: 'IT & Analytics',
          location: 'Jaipur',
          proficiencyLevel: 'Intermediate',
          minExperience: 1,
          salaryRange: '5-9 LPA',
          companyId: tcs.id
        }
      });
    }

    const otherJobs = [
      { title: 'Full Stack Developer', description: 'Build enterprise cloud applications', requirements: 'React, Node.js, MongoDB, Docker, AWS, Git, REST API, TypeScript', sector: 'IT', location: 'Mumbai', proficiencyLevel: 'Intermediate', salaryRange: '6-10 LPA', companyId: tcs.id },
      { title: 'Data Scientist', description: 'Machine learning and deep predictive modeling', requirements: 'Python, Machine Learning, Deep Learning, TensorFlow, Pandas, SQL, Data Visualization, Statistics', sector: 'IT & Analytics', location: 'Bangalore', proficiencyLevel: 'Advanced', salaryRange: '10-18 LPA', companyId: infosys.id },
      { title: 'Cloud DevOps Engineer', description: 'Maintain CI/CD pipelines and Kubernetes clusters', requirements: 'AWS, Azure, Docker, Kubernetes, Terraform, Linux, CI/CD', sector: 'Cloud & Infrastructure', location: 'Hyderabad', proficiencyLevel: 'Intermediate', salaryRange: '8-15 LPA', companyId: wipro.id },
      { title: 'Junior Data Analyst', description: 'Data munging, SQL querying and Excel dashboard reporting', requirements: 'Excel, SQL, Power BI, Python', sector: 'IT & Analytics', location: 'Jaipur', proficiencyLevel: 'Beginner', salaryRange: '4-7 LPA', companyId: tcs.id },
      { title: 'Web Developer', description: 'Design and develop responsive web applications, interactive interfaces, and RESTful APIs.', requirements: 'React, Node.js, JavaScript, HTML, CSS, MongoDB, Git, REST API, Express, TypeScript', sector: 'IT', location: 'Jaipur', proficiencyLevel: 'Intermediate', salaryRange: '5-9 LPA', companyId: tcs.id },
      { title: 'Frontend Developer', description: 'Build responsive, accessible user interfaces with modern React, JavaScript and modern CSS.', requirements: 'React, JavaScript, HTML, CSS, Tailwind CSS, TypeScript, Git, Redux', sector: 'IT', location: 'Jaipur', proficiencyLevel: 'Beginner', salaryRange: '4-8 LPA', companyId: tcs.id },
      { title: 'Cloud & DevOps Engineer', description: 'Manage cloud architecture, container orchestration, and automated CI/CD pipelines.', requirements: 'AWS, Docker, Kubernetes, Linux, Terraform, CI/CD, Python', sector: 'Cloud & Infrastructure', location: 'Jaipur', proficiencyLevel: 'Intermediate', salaryRange: '7-12 LPA', companyId: infosys.id },
      { title: 'Cybersecurity Analyst', description: 'Vulnerability assessment, network defense, penetration testing and security auditing.', requirements: 'Cybersecurity, Network Security, Ethical Hacking, Linux, Python, Cryptography, OWASP', sector: 'IT & Security', location: 'Delhi NCR', proficiencyLevel: 'Intermediate', salaryRange: '7-14 LPA', companyId: wipro.id },
      { title: 'Mobile Application Developer', description: 'Native and cross-platform mobile apps for Android and iOS devices.', requirements: 'Flutter, React Native, Android, JavaScript, Git, REST API, Firebase', sector: 'IT', location: 'Pune', proficiencyLevel: 'Intermediate', salaryRange: '6-11 LPA', companyId: infosys.id },
      { title: 'Web Developer', description: 'Enterprise full-stack web applications and microservices engineering.', requirements: 'React, Node.js, JavaScript, HTML, CSS, MongoDB, Git, REST API, TypeScript', sector: 'IT', location: 'Bangalore', proficiencyLevel: 'Intermediate', salaryRange: '7-12 LPA', companyId: infosys.id }
    ];

    for (const job of otherJobs) {
      const exists = await prisma.jobPosting.findFirst({ where: { title: job.title, location: job.location } });
      if (!exists) {
        await prisma.jobPosting.create({ data: job }).catch(() => {});
      }
    }

    // 6. Demo Syllabus & Initial Gap Report (Jaipur Data Analyst: Excel + Basic SQL -> 40% Alignment)
    let syllabus = await prisma.syllabus.findFirst({
      where: { collegeId: college.id, branch: 'Computer Science (Data Analytics)' }
    });

    const demoSyllabusData = {
      branch: 'Computer Science (Data Analytics)',
      semester: 'Semester 5',
      subjects: 'Database Management Systems, Business Spreadsheets',
      content: 'Spreadsheet Analysis with Advanced Excel, Formulas, Pivot Tables, Relational Database Management Systems, Basic SQL Queries, ER Diagrams, Relational Normalization.',
      university: 'Rajasthan Technical University (RTU)',
      lastUpdated: '2022',
      collegeId: college.id
    };

    if (!syllabus) {
      syllabus = await prisma.syllabus.create({ data: demoSyllabusData });
    } else {
      syllabus = await prisma.syllabus.update({
        where: { id: syllabus.id },
        data: demoSyllabusData
      });
    }

    const demoReportData = {
      syllabusId: syllabus.id,
      collegeId: college.id,
      overallScore: 40,
      matchedSkills: 'excel, sql',
      missingSkills: 'power bi, python, statistics',
      obsoleteSkills: 'legacy office automation tools',
      recommendations: JSON.stringify([
        'Integrate Python for Data Science and Pandas in Sem 5 Lab',
        'Adopt Microsoft Power BI Desktop for visual analytics coursework',
        'Introduce Applied Inferential Statistics and Hypothesis Testing'
      ]),
      demandAnalysis: JSON.stringify({
        targetRole: 'Data Analyst',
        district: 'Jaipur',
        demandedSkills: ['sql', 'power bi', 'python', 'excel', 'statistics'],
        syllabusSkills: ['excel', 'sql'],
        missingSkills: ['power bi', 'python', 'statistics'],
        validationStatus: 'Employer Validated',
        validatedBy: 'Tata Consultancy Services (Jaipur)',
        validationComment: 'Hiring committee confirms Power BI, Python scripting, and Applied Statistics are essential competencies for hiring entry-level Data Analysts.',
        validatedAt: new Date().toISOString(),
        revisionStatus: 'Pending Revision',
        previousScore: 40
      })
    };

    let gapReport = await prisma.gapReport.findFirst({
      where: { syllabusId: syllabus.id }
    });

    if (!gapReport) {
      gapReport = await prisma.gapReport.create({ data: demoReportData });
    } else {
      gapReport = await prisma.gapReport.update({
        where: { id: gapReport.id },
        data: demoReportData
      });
    }

    // 7. Demo District Training Plan for Jaipur
    const existingPlan = await prisma.trainingPlan.findFirst({
      where: { district: 'Jaipur' }
    });

    if (!existingPlan) {
      await prisma.trainingPlan.create({
        data: {
          district: 'Jaipur',
          targetSkills: 'Power BI, Python, Statistics',
          recommendedCourses: JSON.stringify([
            { courseName: 'Applied Python for Data Analytics', duration: '8 Weeks', provider: 'IIT Madras / NPTEL' },
            { courseName: 'Business Intelligence & Dashboards with Power BI', duration: '6 Weeks', provider: 'Microsoft Learn' },
            { courseName: 'Foundations of Statistical Inference', duration: '4 Weeks', provider: 'Coursera / Industry Sandbox' }
          ]),
          trainerRequirements: '1x Certified Power BI Enterprise Trainer, 1x Python Data Science Instructor',
          equipmentNeeded: 'Computer Lab upgraded with 30x Workstations (16GB RAM, i7), Power BI Desktop, Local PostgreSQL/Jupyter Server',
          timeline: '4 Months (Fall 2026)',
          status: 'Approved'
        }
      });
    }

    // 8. Demo Employer Surveys
    const existingSurvey = await prisma.employerSurvey.findFirst({
      where: { companyId: tcs.id, hiringDistrict: 'Jaipur' }
    });

    if (!existingSurvey) {
      await prisma.employerSurvey.create({
        data: {
          satisfactionScore: 3,
          feedbackText: 'Jaipur college graduates have good SQL & Excel foundations, but lack Power BI and Python data analysis abilities.',
          skillsNeeded: 'Power BI, Python, Statistics',
          hiringDistrict: 'Jaipur',
          candidateQuality: 'Average',
          companyId: tcs.id
        }
      });
    }

    // 9. Demo Placement Records
    const existingPlacement = await prisma.placementRecord.findFirst({
      where: { companyId: tcs.id, studentId: student.id }
    });

    if (!existingPlacement) {
      await prisma.placementRecord.create({
        data: {
          jobRole: 'Data Analyst',
          package: '6.5 LPA',
          location: 'Jaipur',
          isPlaced: true,
          studentId: student.id,
          companyId: tcs.id
        }
      });
    }

    res.json({
      message: 'Demo scenario seeded successfully! (Jaipur -> Data Analyst ready for demonstration)',
      demoDetails: {
        role: 'Data Analyst',
        district: 'Jaipur',
        college: 'Jaipur Engineering College (jecrc@demo.com / demo123)',
        company: 'TCS Jaipur (tcs@demo.com / demo123)',
        admin: 'Govt Admin (admin@demo.com / demo123)',
        student: 'Pooja Verma (student@demo.com / demo123)',
        initialScore: '40%',
        missingSkills: ['power bi', 'python', 'statistics']
      }
    });
  } catch (error) {
    console.error("Seed Error:", error);
    res.status(500).json({ message: 'Seed error', error });
  }
});

// ─── SERVE FRONTEND (SINGLE-LINK PRODUCTION DEPLOYMENT) ────────────────────────
const possibleDistPaths = [
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist')
];
const frontendDist = possibleDistPaths.find(p => fs.existsSync(p));

if (frontendDist) {
  console.log(`Serving static frontend build from ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req: any, res: any, next: any) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`ML Engine expected at ${ML_ENGINE_URL}`);
});
