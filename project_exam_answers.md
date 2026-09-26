**Q1. Explain the process that you have adopted for literature survey? Write the names of any five papers/web sources/books/articles that you found most informative for understanding your project. (Give proper description or detailed links) (2+3=5)**

**Process adopted:**
I searched platforms like Google Scholar using terms like "skill gap in India" and "industry vs academia". Instead of reading full papers, I checked abstracts first and only downloaded those matching our SIH problem statement.

**Five sources:**
1. **World Economic Forum - "Future of Jobs Report":** Showed me which tech skills will be in high demand.
2. **NEP 2020 Guidelines:** Helped me understand the government's plan for vocational training.
3. **"Bridging Industry-Academia Skill Gap" (IEEE):** Explained how syllabus updates take years, but software tools change quickly.
4. **LinkedIn Workplace Learning Report:** Showed what HRs actually look for in freshers.
5. **Maharashtra Skill Development Portals:** Helped me see where current government training platforms lack real-time industry tracking.

---

**Q2. What are findings and outcomes of your study that you have done with reference to question number 1? (5)**

I found a major "time delay" issue: university syllabuses update slowly, while IT moves fast. Also, there's no direct communication between tech companies and curriculum designers. Companies post jobs, but colleges don't automatically analyze them to see what topics they are missing. Finally, students get confused by too much online information. 

**Outcome:** We need an automated software platform that reads job requirements and tells colleges exactly what topics to teach, while guiding students on what extra skills they need.

---

**Q3. Which methodology have you used in your project? Explain the workflow of your project? Name the different modules/processes of your project? (1+1+3=5)**

**Methodology:**
We are using Agile Methodology because SIH requirements can change. Agile lets us build step-by-step and improve based on feedback.

**Workflow:**
1. Companies enter job descriptions into our system.
2. The system compares the college syllabus with industry data.
3. It generates a "Skill Gap Report".
4. Colleges update subjects, and students get course recommendations.

**Different modules:**
1. **Industry Module:** Companies post skill requirements.
2. **College Module:** Colleges upload syllabus and view gap reports.
3. **Student Module:** Students see trending skills and recommendations.
4. **Govt Module:** Admins view state employment analytics.
5. **Gap Analysis Engine:** The core system matching syllabus with industry demands.

---

**Q4. What is the objective of your project? What features you will be adding to project to achieve that objective. (5)**

**Objective:**
Our main objective is to reduce the skill gap between college students and the IT industry by creating an automated platform that aligns college syllabus with real-time job market demands, making students more employable.

**Features to add:**
1. **Automated Gap Analyzer:** Compares current job postings with the college syllabus to find missing topics.
2. **Real-time College Dashboard:** Shows universities exactly which subjects need updates based on industry data.
3. **Student Upskilling Portal:** Recommends personalized short courses to students based on trending market skills.
4. **Industry Feedback System:** Allows companies to directly suggest skills to colleges.

---

**Q5. Explain the workflow for your project. Describe the technology you will be using for your project?**

**Workflow:**
1. Companies post their latest job requirements and skills needed.
2. Colleges upload their current teaching syllabus.
3. Our AI/ML engine matches the two datasets and generates a detailed "Skill Gap Report".
4. Colleges use this report to update their teaching, while students use it to learn missing skills through recommended courses.

**Technology Used:**
*   **Frontend:** HTML, CSS, JavaScript (React.js) for a clean user interface.
*   **Backend:** Node.js with Express for handling logic and API requests.
*   **Database:** MongoDB to store student profiles, syllabus data, and job postings.
*   **AI/ML Model:** Python (using libraries like NLTK or SpaCy) for text analysis to match job descriptions with syllabus text.

---

**Project Exam Image Questions:**

**Q1. Design the proposed project system and prepare a concise design document covering the following:**

**a) Draw and explain the overall architecture of the proposed system. [3 Marks]**

**Architecture Diagram (To draw on paper):**
[Frontend (React.js)] <---> [Backend API (Node.js/Express)] <---> [Database (MongoDB)]
                                   |
                                   v
                        [AI/ML Engine (Python)]

**Explanation:**
We are using a simple 3-tier architecture:
1. **Frontend:** Created with React.js. This is the UI where students, colleges, and companies will log in and see their dashboards.
2. **Backend:** Made using Node.js and Express. It handles all the data passing between the frontend and database.
3. **Database:** We are using MongoDB to store all user info, syllabus data, and job posts.
4. **AI/ML Engine:** This is a separate Python script connected to the backend. It takes the text from the syllabus and jobs, compares them, and finds out which skills are missing.

**b) Discuss the major modules/components and explain the functionality of each module. [3 Marks]**

1. **Industry Module:** Here companies can create an account and post their latest job requirements and the exact skills they want in freshers.
2. **College Module:** Universities use this to upload their current syllabus. They can check the "Skill Gap Report" to see what topics they need to add.
3. **Student Module:** Students can view trending skills in the market and get recommendations for extra short courses to learn those missing skills.
4. **Gap Analysis Engine:** This is the core part. It matches the industry data with the college syllabus and generates the final gap reports.

**c) Design the database schema, ER diagram, class diagram, or data structure as applicable to the project. [3 Marks]**

**Database Schema (MongoDB Collections):**

1. **Users Collection:**
   - UserID, Name, Role (Student/College/Company), Email, Password
2. **College Syllabus Collection:**
   - CollegeID, Branch, Semester, SubjectList, SyllabusText
3. **Job Posting Collection:**
   - CompanyID, JobRole, RequiredSkills, DatePosted
4. **Skill Gap Report Collection:**
   - ReportID, CollegeID, MissingSkills, MatchedSkills

**d) Provide an appropriate flowchart, sequence diagram, activity diagram, or use-case diagram showing the system workflow. [3 Marks]**

**Flowchart (To draw on paper):**
[Start] -> [User Login]
If Industry -> [Post Job Skills Required] -> [Save to DB]
If College -> [Upload Syllabus] -> [Save to DB]
Then -> [System runs AI Matcher] -> [Compares Jobs vs Syllabus] -> [Generates Gap Report]
Finally -> [Show Report to College] & [Suggest Courses to Student] -> [End]

**e) Demonstrate the working of the project using suitable input and output. [3 Marks]**

**Input given to the system:**
*   **From Company:** Job post for "Web Developer". Skills required: React, Node.js, MongoDB, Git.
*   **From College:** IT 5th Sem Syllabus. Contains: HTML, CSS, JavaScript, Basic PHP.

**Processing by the system:**
*   The AI Engine compares both. It sees HTML/CSS/JS is there, but React, Node.js, MongoDB, and Git are missing.

**Output from the system:**
*   **For College Dashboard:** Shows "Missing Skills: React, Node.js, MongoDB, Git". Recommends updating syllabus.
*   **For Student Dashboard:** Shows notification: "Learn React and Node.js to improve chances for Web Developer jobs" and gives links to courses.
