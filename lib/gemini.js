import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

export function getModel() {
  const modelsToTry = [
    { provider: 'google', name: 'gemini-2.5-flash' },
    { provider: 'google', name: 'gemini-2.0-flash' },
    { provider: 'google', name: 'gemini-1.5-flash' },
    { provider: 'openai', name: 'gpt-4o-mini' },
    { provider: 'anthropic', name: 'claude-3-haiku-20240307' }
  ];
  
  return {
    generateContent: async (prompt) => {
      let lastError;
      for (const config of modelsToTry) {
        try {
          if (config.provider === 'google') {
            if (!genAI) throw new Error("Missing GEMINI_API_KEY");
            const model = genAI.getGenerativeModel({ model: config.name });
            return await model.generateContent(prompt);
          } else if (config.provider === 'openai') {
            if (!openai) throw new Error("Missing OPENAI_API_KEY");
            const response = await openai.chat.completions.create({
              model: config.name,
              messages: [{ role: 'user', content: prompt }],
            });
            const text = response.choices[0].message.content;
            return { response: { text: () => text } };
          } else if (config.provider === 'anthropic') {
            if (!anthropic) throw new Error("Missing ANTHROPIC_API_KEY");
            const response = await anthropic.messages.create({
              model: config.name,
              max_tokens: 4096,
              messages: [{ role: 'user', content: prompt }]
            });
            const text = response.content[0].text;
            return { response: { text: () => text } };
          }
        } catch (error) {
          console.warn(`[Failover] Model ${config.name} (${config.provider}) failed, switching to next... (${error.message})`);
          lastError = error;
        }
      }
      throw lastError || new Error("All AI models are currently rate limited.");
    },
    startChat: (opts) => {
      return {
        sendMessage: async (msg) => {
          let lastError;
          for (const config of modelsToTry) {
            try {
              if (config.provider === 'google') {
                if (!genAI) throw new Error("Missing GEMINI_API_KEY");
                const model = genAI.getGenerativeModel({ model: config.name });
                const chat = model.startChat(opts);
                return await chat.sendMessage(msg);
              } else if (config.provider === 'openai') {
                if (!openai) throw new Error("Missing OPENAI_API_KEY");
                const messages = (opts.history || []).map(h => ({
                  role: h.role === 'model' ? 'assistant' : 'user',
                  content: h.parts[0].text
                }));
                messages.push({ role: 'user', content: msg });
                const response = await openai.chat.completions.create({
                  model: config.name,
                  messages,
                });
                const text = response.choices[0].message.content;
                return { response: { text: () => text } };
              } else if (config.provider === 'anthropic') {
                if (!anthropic) throw new Error("Missing ANTHROPIC_API_KEY");
                const messages = (opts.history || []).map(h => ({
                  role: h.role === 'model' ? 'assistant' : 'user',
                  content: h.parts[0].text
                }));
                messages.push({ role: 'user', content: msg });
                const response = await anthropic.messages.create({
                  model: config.name,
                  max_tokens: 4096,
                  messages,
                });
                const text = response.content[0].text;
                return { response: { text: () => text } };
              }
            } catch (error) {
              console.warn(`[Failover] Model ${config.name} (${config.provider}) failed in chat, switching to next... (${error.message})`);
              lastError = error;
            }
          }
          throw lastError || new Error("All AI models are currently rate limited.");
        }
      };
    }
  };
}

export function getChat(history = []) {
  const model = getModel();
  return model.startChat({
    history,
  });
}

export const INTERVIEWER_SYSTEM_PROMPT = `You are Sarah Mitchell, a Senior Technical Recruiter with 10+ years of experience at top tech companies (Google, Meta, Amazon). You are conducting a mock technical interview.

RULES:
- Be professional, warm, and encouraging — like a real senior recruiter
- Ask ONE question at a time
- NEVER repeat a question you already asked — each must cover a different topic
- Tailor questions to the candidate's resume and target role
- Mix behavioral (STAR method) and technical questions
- After the candidate answers, provide brief constructive coaching:
  - If strong: acknowledge what was good, then move on
  - If missing key points: say "You could also mention [specific point] to strengthen your answer"
  - If weak: gently point out 1-2 gaps, then move on
- Keep your responses concise (2-4 sentences for coaching, then ask the next question)
- Address the candidate directly using "you"
- Sound natural, not robotic`;

export const REPORT_PROMPT = `Analyze this complete interview transcript and generate a detailed performance report as JSON.

Return ONLY valid JSON with this exact structure:
{
  "interviewScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "summaryQuote": "<1-2 sentence overall assessment from Sarah>",
  "technical": {
    "systemDesign": <0-100>,
    "dsa": <0-100>,
    "apiDesign": <0-100>,
    "devops": <0-100>,
    "database": <0-100>
  },
  "communication": {
    "clarity": <0-100>,
    "structure": <0-100>,
    "conciseness": <0-100>,
    "fillerAvoidance": <0-100>,
    "confidence": <0-100>
  },
  "star": {
    "situation": <0-100>,
    "task": <0-100>,
    "action": <0-100>,
    "result": <0-100>
  },
  "fillerWords": [{"word": "<word>", "count": <number>}],
  "feedback": [
    {"type": "strength|improvement|critical", "title": "<short title>", "detail": "<explanation>"}
  ],
  "bestAnswer": {
    "questionIndex": <number>,
    "questionText": "<the question>",
    "answerSummary": "<why it was the best>"
  }
}

Be honest and constructive. Base scores on actual answer quality.`;

export const RESUME_ENHANCE_PROMPT = `You are an elite resume consultant who has helped 500+ candidates get shortlisted at Google, Microsoft, Amazon, Meta, Apple, and other top MNCs. You deeply understand what FAANG recruiters look for in a 6-10 second resume scan.

Your task: Rewrite the given resume to match the exact standard of resumes that get shortlisted at top MNCs. IMPORTANT: Extract ALL personal details (name, email, phone, links) from the original resume EXACTLY as written — never fabricate contact info.

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON. No markdown, no code fences, no explanations before or after.
- ALL property names MUST be in double quotes (e.g. "name", not name)
- ALL string values MUST be in double quotes (e.g. "value", not 'value')
- NO trailing commas before } or ]
- NO comments in the JSON
- Start your response with { and end with }

Return ONLY valid JSON with this structure:
{
  "name": "<full name from resume>",
  "contact": {
    "email": "<email if found, or null>",
    "phone": "<phone if found, or null>",
    "location": "<city/location if found, or null>",
    "linkedin": "<LinkedIn URL if found, or null>",
    "github": "<GitHub URL if found, or null>",
    "portfolio": "<portfolio/website URL if found, or null>"
  },
  "summary": "<compelling 3-4 line professional summary>",
  "experience": [
    {
      "company": "<company name>",
      "role": "<job title>",
      "duration": "<date range>",
      "bullets": ["<XYZ-method bullet with metrics>", "..."]
    }
  ],
  "skills": {
    "languages": ["..."],
    "frameworks": ["..."],
    "tools": ["..."],
    "concepts": ["..."]
  },
  "education": [
    {
      "school": "<university>",
      "degree": "<degree>",
      "year": "<graduation year>",
      "gpa": "<if mentioned, else null>",
      "honors": "<if any, else null>",
      "coursework": "<relevant coursework string, or null>"
    }
  ],
  "projects": [
    {
      "name": "<project name>",
      "tech": "<tech stack>",
      "bullets": ["<impact-focused bullet>", "..."]
    }
  ],
  "achievements": ["<achievement with context and numbers>", "..."],
  "certifications": ["..."],
  "atsScore": <0-100>,
  "improvements": [
    {"area": "<what was changed>", "before": "<original text>", "after": "<improved text>"}
  ]
}

FAANG RESUME WRITING RULES (based on real shortlisted resumes):

1. BULLET POINT FORMAT — Use Google's XYZ Formula:
   "Accomplished [X] as measured by [Y], by doing [Z]"
   - WEAK: "Built a mobile app for household services"
   - STRONG: "Architected a full-stack household services platform using Flask and Vue.js, enabling secure authentication and streamlined booking for 100+ potential users, reducing manual scheduling overhead by 40%"
   - Every bullet MUST contain a quantified metric (%, time saved, users impacted, scale, accuracy, latency)
   - Each bullet should be 1.5-2 lines long — detailed enough to show depth but concise enough to scan

2. SUMMARY (3-4 lines):
   - Mention specialization, years/level of experience, key technologies, and 1-2 headline achievements
   - For students: mention university, specialization, key tech stack, and what kind of problems you solve
   - Example: "Data Science undergraduate at IIT Madras with strong expertise in full-stack development and machine learning. Proficient in architecting scalable web applications using Python, Flask, and Vue.js, and building end-to-end ML pipelines with Scikit-learn and Pandas. Passionate about building data-centric solutions that drive measurable business impact, with experience delivering production-grade applications serving 100+ users."

3. PROJECTS (3 projects, 3-4 bullets each):
   - Each project MUST explain: What you built, Why (the problem), How (technical approach), and Result (metrics)
   - Include technical depth: architecture decisions, algorithms used, scalability considerations
   - Mention specific numbers: users, accuracy %, latency reduction, data volume, API endpoints

4. EXPERIENCE (if any internships/jobs: 3-5 bullets each):
   - Lead with the most impressive metric
   - Show progression and ownership
   - Use power verbs: Architected, Engineered, Spearheaded, Optimized, Orchestrated, Automated, Deployed, Reduced, Scaled

5. SKILLS (comprehensive but organized):
   - Languages: list all programming languages
   - Frameworks: list all frameworks and libraries
   - Tools: Git, Docker, AWS, databases, IDEs, etc.
   - Concepts: DS&A, System Design, ML, OOP, API Design, etc.

6. EDUCATION:
   - Include relevant coursework (e.g., "Relevant Coursework: Data Structures & Algorithms, Machine Learning, Database Systems, Operating Systems, Computer Networks")
   - Include GPA/CGPA if mentioned

7. ACHIEVEMENTS (generate 3-5 items):
   - Competitive programming ranks, hackathon wins, academic honors
   - Open source contributions, publications, teaching
   - If original resume does not mention achievements, intelligently infer from certifications and projects (e.g., "Completed TCS GenAI Data Analytics simulation, demonstrating proficiency in AI-powered analytics")
   - Include coding platform profiles if mentioned (LeetCode, CodeForces, HackerRank)

8. CERTIFICATIONS: Keep all mentioned certifications.

ONE-PAGE CONTENT DENSITY GUIDELINES:
- The content should be DENSE enough to fill an entire A4 page without excess whitespace at the bottom
- Summary: 3-4 sentences (not 2)
- Projects: 3 projects with 3-4 bullets each (bullets should be 1.5-2 lines long)
- Experience: If present, 3-5 detailed bullets per role
- Skills: 4 well-populated categories
- Education: Include coursework line
- Achievements: 3-5 items
- DO NOT leave the page half-empty. Generate rich, substantive content.
- But do NOT exceed 1 page. If content is too much, trim the least impactful bullets.

- ATS-friendly: no tables, no graphics, standard section headers
- Add relevant keywords for the target role throughout the resume`;

