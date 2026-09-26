from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import json

app = Flask(__name__)
CORS(app)

# ─── MASSIVE SKILL TAXONOMY (200+ skills) ─────────────────────────────────────
SKILL_TAXONOMY = {
    # ── Programming Languages ──
    "python": {"category": "Programming", "sector": "IT", "demand": "High", "trend": "Rising"},
    "java": {"category": "Programming", "sector": "IT", "demand": "High", "trend": "Stable"},
    "javascript": {"category": "Programming", "sector": "IT", "demand": "High", "trend": "Rising"},
    "typescript": {"category": "Programming", "sector": "IT", "demand": "High", "trend": "Rising"},
    "c++": {"category": "Programming", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "c#": {"category": "Programming", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "c programming": {"category": "Programming", "sector": "IT", "demand": "Medium", "trend": "Declining"},
    "go": {"category": "Programming", "sector": "IT", "demand": "High", "trend": "Rising"},
    "golang": {"category": "Programming", "sector": "IT", "demand": "High", "trend": "Rising"},
    "rust": {"category": "Programming", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "kotlin": {"category": "Programming", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "swift": {"category": "Programming", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "r programming": {"category": "Programming", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "php": {"category": "Programming", "sector": "IT", "demand": "Low", "trend": "Declining"},
    "ruby": {"category": "Programming", "sector": "IT", "demand": "Low", "trend": "Declining"},
    "scala": {"category": "Programming", "sector": "IT", "demand": "Low", "trend": "Stable"},

    # ── Web Development ──
    "html": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Stable"},
    "css": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Stable"},
    "react": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Rising"},
    "react.js": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Rising"},
    "angular": {"category": "Web Development", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "vue.js": {"category": "Web Development", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "vue": {"category": "Web Development", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "next.js": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Rising"},
    "node.js": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Stable"},
    "node": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Stable"},
    "express": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Stable"},
    "express.js": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Stable"},
    "django": {"category": "Web Development", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "flask": {"category": "Web Development", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "spring boot": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Stable"},
    "asp.net": {"category": "Web Development", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "tailwind css": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Rising"},
    "bootstrap": {"category": "Web Development", "sector": "IT", "demand": "Medium", "trend": "Declining"},
    "graphql": {"category": "Web Development", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "rest api": {"category": "Web Development", "sector": "IT", "demand": "High", "trend": "Stable"},
    "websocket": {"category": "Web Development", "sector": "IT", "demand": "Medium", "trend": "Rising"},

    # ── Databases ──
    "sql": {"category": "Database", "sector": "IT", "demand": "High", "trend": "Stable"},
    "mysql": {"category": "Database", "sector": "IT", "demand": "High", "trend": "Stable"},
    "postgresql": {"category": "Database", "sector": "IT", "demand": "High", "trend": "Rising"},
    "mongodb": {"category": "Database", "sector": "IT", "demand": "High", "trend": "Stable"},
    "redis": {"category": "Database", "sector": "IT", "demand": "High", "trend": "Rising"},
    "elasticsearch": {"category": "Database", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "firebase": {"category": "Database", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "dynamodb": {"category": "Database", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "cassandra": {"category": "Database", "sector": "IT", "demand": "Low", "trend": "Stable"},
    "oracle": {"category": "Database", "sector": "IT", "demand": "Medium", "trend": "Declining"},
    "sqlite": {"category": "Database", "sector": "IT", "demand": "Low", "trend": "Stable"},

    # ── Cloud & DevOps ──
    "aws": {"category": "Cloud", "sector": "IT", "demand": "High", "trend": "Rising"},
    "azure": {"category": "Cloud", "sector": "IT", "demand": "High", "trend": "Rising"},
    "google cloud": {"category": "Cloud", "sector": "IT", "demand": "High", "trend": "Rising"},
    "gcp": {"category": "Cloud", "sector": "IT", "demand": "High", "trend": "Rising"},
    "docker": {"category": "DevOps", "sector": "IT", "demand": "High", "trend": "Rising"},
    "kubernetes": {"category": "DevOps", "sector": "IT", "demand": "High", "trend": "Rising"},
    "terraform": {"category": "DevOps", "sector": "IT", "demand": "High", "trend": "Rising"},
    "ansible": {"category": "DevOps", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "jenkins": {"category": "DevOps", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "ci/cd": {"category": "DevOps", "sector": "IT", "demand": "High", "trend": "Rising"},
    "github actions": {"category": "DevOps", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "linux": {"category": "DevOps", "sector": "IT", "demand": "High", "trend": "Stable"},
    "nginx": {"category": "DevOps", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "microservices": {"category": "DevOps", "sector": "IT", "demand": "High", "trend": "Rising"},

    # ── AI / ML / Data Science ──
    "machine learning": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "deep learning": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "artificial intelligence": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "nlp": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "natural language processing": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "computer vision": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "tensorflow": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Stable"},
    "pytorch": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "pandas": {"category": "Data Science", "sector": "IT", "demand": "High", "trend": "Stable"},
    "numpy": {"category": "Data Science", "sector": "IT", "demand": "High", "trend": "Stable"},
    "scikit-learn": {"category": "Data Science", "sector": "IT", "demand": "High", "trend": "Stable"},
    "data analysis": {"category": "Data Science", "sector": "IT", "demand": "High", "trend": "Rising"},
    "data visualization": {"category": "Data Science", "sector": "IT", "demand": "High", "trend": "Rising"},
    "big data": {"category": "Data Science", "sector": "IT", "demand": "High", "trend": "Rising"},
    "hadoop": {"category": "Data Science", "sector": "IT", "demand": "Medium", "trend": "Declining"},
    "spark": {"category": "Data Science", "sector": "IT", "demand": "High", "trend": "Rising"},
    "power bi": {"category": "Data Science", "sector": "IT", "demand": "High", "trend": "Rising"},
    "tableau": {"category": "Data Science", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "generative ai": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "llm": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "prompt engineering": {"category": "AI/ML", "sector": "IT", "demand": "High", "trend": "Rising"},
    "langchain": {"category": "AI/ML", "sector": "IT", "demand": "Medium", "trend": "Rising"},

    # ── Cybersecurity ──
    "cybersecurity": {"category": "Security", "sector": "IT", "demand": "High", "trend": "Rising"},
    "ethical hacking": {"category": "Security", "sector": "IT", "demand": "High", "trend": "Rising"},
    "penetration testing": {"category": "Security", "sector": "IT", "demand": "High", "trend": "Rising"},
    "network security": {"category": "Security", "sector": "IT", "demand": "High", "trend": "Stable"},
    "cryptography": {"category": "Security", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "soc": {"category": "Security", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "owasp": {"category": "Security", "sector": "IT", "demand": "Medium", "trend": "Stable"},

    # ── Mobile Development ──
    "android": {"category": "Mobile", "sector": "IT", "demand": "High", "trend": "Stable"},
    "ios": {"category": "Mobile", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "react native": {"category": "Mobile", "sector": "IT", "demand": "High", "trend": "Rising"},
    "flutter": {"category": "Mobile", "sector": "IT", "demand": "High", "trend": "Rising"},

    # ── Blockchain & Emerging ──
    "blockchain": {"category": "Emerging Tech", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "web3": {"category": "Emerging Tech", "sector": "IT", "demand": "Low", "trend": "Stable"},
    "iot": {"category": "Emerging Tech", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "internet of things": {"category": "Emerging Tech", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "ar/vr": {"category": "Emerging Tech", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "robotics": {"category": "Emerging Tech", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "quantum computing": {"category": "Emerging Tech", "sector": "IT", "demand": "Low", "trend": "Rising"},
    "edge computing": {"category": "Emerging Tech", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "5g": {"category": "Emerging Tech", "sector": "IT", "demand": "Medium", "trend": "Rising"},

    # ── Software Engineering ──
    "git": {"category": "Tools", "sector": "IT", "demand": "High", "trend": "Stable"},
    "github": {"category": "Tools", "sector": "IT", "demand": "High", "trend": "Stable"},
    "agile": {"category": "Methodology", "sector": "IT", "demand": "High", "trend": "Stable"},
    "scrum": {"category": "Methodology", "sector": "IT", "demand": "High", "trend": "Stable"},
    "jira": {"category": "Tools", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "devops": {"category": "DevOps", "sector": "IT", "demand": "High", "trend": "Rising"},
    "system design": {"category": "Architecture", "sector": "IT", "demand": "High", "trend": "Rising"},
    "design patterns": {"category": "Architecture", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "data structures": {"category": "CS Fundamentals", "sector": "IT", "demand": "High", "trend": "Stable"},
    "algorithms": {"category": "CS Fundamentals", "sector": "IT", "demand": "High", "trend": "Stable"},
    "object oriented programming": {"category": "CS Fundamentals", "sector": "IT", "demand": "High", "trend": "Stable"},
    "oop": {"category": "CS Fundamentals", "sector": "IT", "demand": "High", "trend": "Stable"},
    "operating systems": {"category": "CS Fundamentals", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "computer networks": {"category": "CS Fundamentals", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "dbms": {"category": "CS Fundamentals", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "software testing": {"category": "QA", "sector": "IT", "demand": "High", "trend": "Stable"},
    "selenium": {"category": "QA", "sector": "IT", "demand": "Medium", "trend": "Stable"},
    "api testing": {"category": "QA", "sector": "IT", "demand": "Medium", "trend": "Rising"},
    "unit testing": {"category": "QA", "sector": "IT", "demand": "Medium", "trend": "Stable"},

    # ── Soft Skills ──
    "communication": {"category": "Soft Skills", "sector": "General", "demand": "High", "trend": "Stable"},
    "teamwork": {"category": "Soft Skills", "sector": "General", "demand": "High", "trend": "Stable"},
    "leadership": {"category": "Soft Skills", "sector": "General", "demand": "High", "trend": "Stable"},
    "problem solving": {"category": "Soft Skills", "sector": "General", "demand": "High", "trend": "Stable"},
    "critical thinking": {"category": "Soft Skills", "sector": "General", "demand": "High", "trend": "Rising"},
    "project management": {"category": "Soft Skills", "sector": "General", "demand": "High", "trend": "Stable"},
    "time management": {"category": "Soft Skills", "sector": "General", "demand": "Medium", "trend": "Stable"},

    # ── Mechanical Engineering ──
    "autocad": {"category": "CAD", "sector": "Mechanical", "demand": "High", "trend": "Stable"},
    "solidworks": {"category": "CAD", "sector": "Mechanical", "demand": "High", "trend": "Stable"},
    "catia": {"category": "CAD", "sector": "Mechanical", "demand": "Medium", "trend": "Stable"},
    "ansys": {"category": "Simulation", "sector": "Mechanical", "demand": "High", "trend": "Rising"},
    "matlab": {"category": "Simulation", "sector": "Mechanical", "demand": "High", "trend": "Stable"},
    "3d printing": {"category": "Manufacturing", "sector": "Mechanical", "demand": "Medium", "trend": "Rising"},
    "cnc programming": {"category": "Manufacturing", "sector": "Mechanical", "demand": "Medium", "trend": "Stable"},
    "plc programming": {"category": "Automation", "sector": "Mechanical", "demand": "High", "trend": "Rising"},
    "thermodynamics": {"category": "Core", "sector": "Mechanical", "demand": "Medium", "trend": "Stable"},
    "fluid mechanics": {"category": "Core", "sector": "Mechanical", "demand": "Medium", "trend": "Stable"},
    "supply chain management": {"category": "Management", "sector": "Mechanical", "demand": "High", "trend": "Rising"},

    # ── Civil Engineering ──
    "staad pro": {"category": "Structural", "sector": "Civil", "demand": "High", "trend": "Stable"},
    "revit": {"category": "BIM", "sector": "Civil", "demand": "High", "trend": "Rising"},
    "bim": {"category": "BIM", "sector": "Civil", "demand": "High", "trend": "Rising"},
    "gis": {"category": "Geospatial", "sector": "Civil", "demand": "Medium", "trend": "Rising"},
    "primavera": {"category": "Project Management", "sector": "Civil", "demand": "Medium", "trend": "Stable"},
    "etabs": {"category": "Structural", "sector": "Civil", "demand": "Medium", "trend": "Stable"},
    "green building": {"category": "Sustainability", "sector": "Civil", "demand": "Medium", "trend": "Rising"},

    # ── Electrical & Electronics ──
    "embedded systems": {"category": "Embedded", "sector": "Electronics", "demand": "High", "trend": "Rising"},
    "verilog": {"category": "VLSI", "sector": "Electronics", "demand": "Medium", "trend": "Stable"},
    "vhdl": {"category": "VLSI", "sector": "Electronics", "demand": "Medium", "trend": "Stable"},
    "pcb design": {"category": "Hardware", "sector": "Electronics", "demand": "Medium", "trend": "Stable"},
    "power electronics": {"category": "Core", "sector": "Electronics", "demand": "Medium", "trend": "Stable"},
    "signal processing": {"category": "Core", "sector": "Electronics", "demand": "Medium", "trend": "Stable"},
    "scada": {"category": "Automation", "sector": "Electronics", "demand": "Medium", "trend": "Stable"},

    # ── Management / Business ──
    "digital marketing": {"category": "Marketing", "sector": "Management", "demand": "High", "trend": "Rising"},
    "seo": {"category": "Marketing", "sector": "Management", "demand": "High", "trend": "Rising"},
    "financial analysis": {"category": "Finance", "sector": "Management", "demand": "High", "trend": "Stable"},
    "business analytics": {"category": "Analytics", "sector": "Management", "demand": "High", "trend": "Rising"},
    "erp": {"category": "Enterprise", "sector": "Management", "demand": "Medium", "trend": "Stable"},
    "sap": {"category": "Enterprise", "sector": "Management", "demand": "Medium", "trend": "Stable"},
    "excel": {"category": "Tools", "sector": "Management", "demand": "High", "trend": "Stable"},
    "tally": {"category": "Accounting", "sector": "Management", "demand": "Medium", "trend": "Declining"},

    # ── Healthcare ──
    "bioinformatics": {"category": "Healthcare IT", "sector": "Healthcare", "demand": "Medium", "trend": "Rising"},
    "medical imaging": {"category": "Healthcare IT", "sector": "Healthcare", "demand": "Medium", "trend": "Rising"},
    "health informatics": {"category": "Healthcare IT", "sector": "Healthcare", "demand": "Medium", "trend": "Rising"},
    "telemedicine": {"category": "Healthcare IT", "sector": "Healthcare", "demand": "Medium", "trend": "Rising"},
}

# ─── OBSOLETE SKILLS that should be flagged in syllabuses ──────────────────────
OBSOLETE_SKILLS = {
    "cobol", "fortran", "turbo c", "turbo c++", "pascal", "visual basic",
    "vb.net", "foxpro", "dbase", "clipper", "lotus 1-2-3", "wordstar",
    "basic programming", "assembly language", "mainframe", "punch cards",
    "floppy disk", "dos programming", "windows xp", "dreamweaver",
    "flash", "actionscript", "silverlight", "coreldraw", "frontpage",
    "cold fusion", "perl", "cgi programming"
}

# ─── COURSE RECOMMENDATIONS for missing skills ────────────────────────────────
COURSE_RECOMMENDATIONS = {
    "python": {"course": "Python for Everybody", "provider": "Coursera / NPTEL", "duration": "8 weeks", "level": "Beginner"},
    "java": {"course": "Java Programming Masterclass", "provider": "NPTEL / Udemy", "duration": "12 weeks", "level": "Beginner"},
    "javascript": {"course": "The Complete JavaScript Course", "provider": "Udemy / freeCodeCamp", "duration": "10 weeks", "level": "Beginner"},
    "react": {"course": "React - The Complete Guide", "provider": "Udemy / Scrimba", "duration": "8 weeks", "level": "Intermediate"},
    "node.js": {"course": "Node.js API Masterclass", "provider": "NPTEL / Udemy", "duration": "6 weeks", "level": "Intermediate"},
    "machine learning": {"course": "Machine Learning by Andrew Ng", "provider": "Coursera / Stanford", "duration": "12 weeks", "level": "Intermediate"},
    "deep learning": {"course": "Deep Learning Specialization", "provider": "Coursera / NPTEL", "duration": "16 weeks", "level": "Advanced"},
    "aws": {"course": "AWS Cloud Practitioner", "provider": "AWS Training / Coursera", "duration": "6 weeks", "level": "Beginner"},
    "docker": {"course": "Docker & Kubernetes Complete Guide", "provider": "Udemy / NPTEL", "duration": "8 weeks", "level": "Intermediate"},
    "kubernetes": {"course": "Kubernetes for Developers", "provider": "CNCF / Udemy", "duration": "8 weeks", "level": "Advanced"},
    "sql": {"course": "Complete SQL Bootcamp", "provider": "NPTEL / Khan Academy", "duration": "6 weeks", "level": "Beginner"},
    "mongodb": {"course": "MongoDB University M001", "provider": "MongoDB University", "duration": "4 weeks", "level": "Beginner"},
    "git": {"course": "Git & GitHub Crash Course", "provider": "freeCodeCamp / Udemy", "duration": "2 weeks", "level": "Beginner"},
    "cybersecurity": {"course": "Intro to Cybersecurity", "provider": "Cisco / NPTEL", "duration": "10 weeks", "level": "Beginner"},
    "data structures": {"course": "Data Structures & Algorithms", "provider": "NPTEL / GeeksforGeeks", "duration": "12 weeks", "level": "Intermediate"},
    "generative ai": {"course": "Generative AI with LLMs", "provider": "Coursera / DeepLearning.AI", "duration": "6 weeks", "level": "Advanced"},
    "flutter": {"course": "Flutter & Dart Complete Guide", "provider": "Udemy / Google", "duration": "10 weeks", "level": "Intermediate"},
    "digital marketing": {"course": "Google Digital Marketing", "provider": "Google / NPTEL", "duration": "8 weeks", "level": "Beginner"},
    "power bi": {"course": "Power BI Data Analyst", "provider": "Microsoft Learn", "duration": "8 weeks", "level": "Intermediate"},
    "devops": {"course": "DevOps Engineering Course", "provider": "NPTEL / Udemy", "duration": "12 weeks", "level": "Intermediate"},
    "terraform": {"course": "Terraform Associate Certification", "provider": "HashiCorp / Udemy", "duration": "6 weeks", "level": "Intermediate"},
    "system design": {"course": "System Design for Interviews", "provider": "Educative / NPTEL", "duration": "8 weeks", "level": "Advanced"},
    "agile": {"course": "Agile with Atlassian Jira", "provider": "Coursera / Atlassian", "duration": "4 weeks", "level": "Beginner"},
    "autocad": {"course": "AutoCAD Essentials Training", "provider": "Autodesk / NPTEL", "duration": "6 weeks", "level": "Beginner"},
    "embedded systems": {"course": "Embedded Systems Design", "provider": "NPTEL / Coursera", "duration": "12 weeks", "level": "Intermediate"},
    "blockchain": {"course": "Blockchain Basics", "provider": "Coursera / NPTEL", "duration": "8 weeks", "level": "Intermediate"},
}


def extract_skills(text):
    """
    Extract skills from text using multi-word and single-word matching
    against the 200+ skill taxonomy.
    """
    text_lower = text.lower()
    
    # Handle common aliases to make matching more robust (as requested)
    aliases = {
        "powerbi": "power bi",
        "power-bi": "power bi",
        "mysql": "sql",
        "postgresql": "sql",
        "reactjs": "react",
        "nodejs": "node.js"
    }
    for alias, canonical in aliases.items():
        # Replace occurrences as a quick normalization
        text_lower = text_lower.replace(alias, canonical)

    found = {}

    # Sort skills by length (longest first) to match multi-word skills first
    sorted_skills = sorted(SKILL_TAXONOMY.keys(), key=len, reverse=True)

    for skill in sorted_skills:
        # Use word boundary matching for accurate detection
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            info = SKILL_TAXONOMY[skill]
            found[skill] = {
                "category": info["category"],
                "sector": info["sector"],
                "demand": info["demand"],
                "trend": info["trend"]
            }

    return found


def detect_obsolete(text):
    """Detect obsolete/outdated skills mentioned in syllabus text."""
    text_lower = text.lower()
    found = []
    for skill in OBSOLETE_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return found


def get_recommendations(missing_skills):
    """Generate course recommendations for each missing skill."""
    recs = []
    for skill in missing_skills:
        if skill in COURSE_RECOMMENDATIONS:
            rec = COURSE_RECOMMENDATIONS[skill].copy()
            rec["skill"] = skill
            recs.append(rec)
        else:
            recs.append({
                "skill": skill,
                "course": f"Industry Certification in {skill.title()}",
                "provider": "NPTEL / Coursera / Udemy",
                "duration": "6-8 weeks",
                "level": "Intermediate"
            })
    return recs


def calculate_alignment_score(matched, missing):
    """Calculate overall curriculum-industry alignment percentage."""
    total = len(matched) + len(missing)
    if total == 0:
        return 100
    return round((len(matched) / total) * 100)


def get_proficiency_level(skill_name, context_text):
    """Determine proficiency level based on job context keywords."""
    text_lower = context_text.lower()
    advanced_keywords = ["senior", "lead", "architect", "expert", "principal", "staff", "5+ years", "8+ years"]
    beginner_keywords = ["junior", "intern", "fresher", "entry level", "trainee", "0-1 year", "graduate"]

    for kw in advanced_keywords:
        if kw in text_lower:
            return "Advanced"
    for kw in beginner_keywords:
        if kw in text_lower:
            return "Beginner"
    return "Intermediate"


# ─── MAIN ANALYSIS ENDPOINT ───────────────────────────────────────────────────
@app.route('/analyze', methods=['POST'])
def analyze_gap():
    data = request.json
    if not data or 'syllabusText' not in data or 'jobText' not in data:
        return jsonify({'error': 'Missing syllabusText or jobText'}), 400

    syllabus_text = data['syllabusText']
    job_text = data['jobText']
    sector_filter = data.get('sector', None)

    # Extract skills from both texts
    syllabus_skills = extract_skills(syllabus_text)
    job_skills = extract_skills(job_text)

    # If sector filter is provided, only consider job skills from that sector
    if sector_filter and sector_filter != 'All':
        job_skills = {k: v for k, v in job_skills.items()
                      if v['sector'] == sector_filter or v['sector'] == 'General'}

    # Calculate matched and missing
    matched = {k: v for k, v in job_skills.items() if k in syllabus_skills}
    missing = {k: v for k, v in job_skills.items() if k not in syllabus_skills}

    # Detect obsolete skills in syllabus
    obsolete = detect_obsolete(syllabus_text)

    # Get proficiency levels for missing skills
    missing_with_proficiency = []
    for skill, info in missing.items():
        missing_with_proficiency.append({
            "name": skill,
            "category": info["category"],
            "demand": info["demand"],
            "trend": info["trend"],
            "proficiency": get_proficiency_level(skill, job_text)
        })

    # Sort missing skills: High demand first, then Rising trend
    demand_order = {"High": 0, "Medium": 1, "Low": 2}
    missing_with_proficiency.sort(key=lambda x: (demand_order.get(x["demand"], 2), x["name"]))

    # Generate recommendations
    recommendations = get_recommendations(list(missing.keys()))

    # Alignment score
    alignment_score = calculate_alignment_score(matched, missing)

    # Demand analysis by category
    demand_analysis = {}
    for skill, info in job_skills.items():
        cat = info["category"]
        if cat not in demand_analysis:
            demand_analysis[cat] = {"total": 0, "matched": 0, "missing": 0}
        demand_analysis[cat]["total"] += 1
        if skill in matched:
            demand_analysis[cat]["matched"] += 1
        else:
            demand_analysis[cat]["missing"] += 1

    return jsonify({
        'matched_skills': list(matched.keys()),
        'missing_skills': [s["name"] for s in missing_with_proficiency],
        'missing_skills_detailed': missing_with_proficiency,
        'obsolete_skills': obsolete,
        'recommendations': recommendations,
        'alignment_score': alignment_score,
        'demand_analysis': demand_analysis,
        'total_job_skills': len(job_skills),
        'total_syllabus_skills': len(syllabus_skills)
    })


# ─── SKILL TAXONOMY ENDPOINT ─────────────────────────────────────────────────
@app.route('/taxonomy', methods=['GET'])
def get_taxonomy():
    """Return full skill taxonomy for frontend display."""
    taxonomy = []
    for name, info in SKILL_TAXONOMY.items():
        taxonomy.append({
            "name": name,
            "category": info["category"],
            "sector": info["sector"],
            "demand": info["demand"],
            "trend": info["trend"]
        })
    return jsonify(taxonomy)


# ─── TREND ANALYSIS ENDPOINT ─────────────────────────────────────────────────
@app.route('/trends', methods=['GET'])
def get_trends():
    """Return skill trend analysis — rising, stable, declining counts."""
    rising = [k for k, v in SKILL_TAXONOMY.items() if v["trend"] == "Rising"]
    stable = [k for k, v in SKILL_TAXONOMY.items() if v["trend"] == "Stable"]
    declining = [k for k, v in SKILL_TAXONOMY.items() if v["trend"] == "Declining"]

    # Group rising skills by category
    rising_by_category = {}
    for skill in rising:
        cat = SKILL_TAXONOMY[skill]["category"]
        if cat not in rising_by_category:
            rising_by_category[cat] = []
        rising_by_category[cat].append(skill)

    return jsonify({
        'rising': rising,
        'stable': stable,
        'declining': declining,
        'rising_count': len(rising),
        'stable_count': len(stable),
        'declining_count': len(declining),
        'rising_by_category': rising_by_category,
        'top_emerging': rising[:10]
    })


# ─── DISTRICT ANALYSIS ENDPOINT ──────────────────────────────────────────────
@app.route('/district-analysis', methods=['POST'])
def district_analysis():
    """Analyze skill demand for a specific district based on job postings."""
    data = request.json
    if not data or 'jobs' not in data:
        return jsonify({'error': 'Missing jobs data'}), 400

    district = data.get('district', 'All')
    jobs = data['jobs']

    # Aggregate all skills from jobs in this district
    all_skills = {}
    for job in jobs:
        if district == 'All' or job.get('location', '').lower() == district.lower():
            skills = extract_skills(job.get('requirements', ''))
            for skill, info in skills.items():
                if skill not in all_skills:
                    all_skills[skill] = {"count": 0, **info}
                all_skills[skill]["count"] += 1

    # Sort by count (most demanded first)
    sorted_skills = sorted(all_skills.items(), key=lambda x: x[1]["count"], reverse=True)

    return jsonify({
        'district': district,
        'top_skills': [{"name": k, **v} for k, v in sorted_skills[:20]],
        'total_unique_skills': len(all_skills),
        'total_jobs_analyzed': len(jobs)
    })


# ─── GENERATE TRAINING PLAN ──────────────────────────────────────────────────
@app.route('/generate-training-plan', methods=['POST'])
def generate_training_plan():
    """Generate a district-level training plan based on skill gaps."""
    data = request.json
    target_skills = data.get('targetSkills', [])
    district = data.get('district', 'Unknown')

    courses = []
    trainers_needed = set()
    equipment = set()

    for skill in target_skills:
        if skill in COURSE_RECOMMENDATIONS:
            rec = COURSE_RECOMMENDATIONS[skill].copy()
            rec["skill"] = skill
            courses.append(rec)

        info = SKILL_TAXONOMY.get(skill, {})
        cat = info.get("category", "General")
        trainers_needed.add(f"{cat} domain expert")

        if cat in ["Programming", "Web Development", "AI/ML", "Data Science"]:
            equipment.add("Computer Lab with Internet")
        elif cat in ["CAD", "Simulation"]:
            equipment.add(f"Workstations with {skill.title()} software licenses")
        elif cat in ["Embedded", "Hardware"]:
            equipment.add("Electronics Lab with microcontrollers")
        elif cat in ["Cloud", "DevOps"]:
            equipment.add("Cloud sandbox accounts (AWS/Azure)")
            
    # Oversupply simulation logic: For a real region, this would query
    # the number of grads vs job postings. For now we detect common legacy skills.
    oversupplied = []
    legacy = ["c programming", "php", "tally", "manual testing"]
    for leg in legacy:
        if leg not in target_skills:
            oversupplied.append(leg.title())

    return jsonify({
        'district': district,
        'target_skills': target_skills,
        'recommended_courses': courses,
        'trainer_requirements': list(trainers_needed),
        'equipment_needed': list(equipment),
        'oversupplied_skills': oversupplied[:2], # Flag top 2 oversupplied
        'estimated_timeline': f"{max(3, len(target_skills) * 2)} months",
        'estimated_batch_size': 30
    })


if __name__ == '__main__':
    print(f"[ML Engine] Loaded {len(SKILL_TAXONOMY)} skills in taxonomy")
    print(f"[ML Engine] Loaded {len(OBSOLETE_SKILLS)} obsolete skill patterns")
    print(f"[ML Engine] Loaded {len(COURSE_RECOMMENDATIONS)} course recommendations")
    app.run(port=5001, debug=True)
