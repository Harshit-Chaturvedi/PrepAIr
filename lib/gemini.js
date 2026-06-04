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

export const RESUME_ENHANCE_PROMPT = `You are an expert resume writer who has helped hundreds of candidates land jobs at Google, Microsoft, Amazon, Meta, and Apple.

Rewrite the given resume to meet top MNC standards. IMPORTANT: Extract all personal details from the original resume exactly as written.

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
  "summary": "<compelling 2-3 line professional summary>",
  "experience": [
    {
      "company": "<company name>",
      "role": "<job title>",
      "duration": "<date range>",
      "bullets": ["<STAR-method bullet with metrics>", "..."]
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
      "honors": "<if any, else null>"
    }
  ],
  "projects": [
    {
      "name": "<project name>",
      "tech": "<tech stack>",
      "bullets": ["<impact-focused bullet>", "..."]
    }
  ],
  "certifications": ["..."],
  "atsScore": <0-100>,
  "improvements": [
    {"area": "<what was changed>", "before": "<original text>", "after": "<improved text>"}
  ]
}

RULES:
- Extract the candidate's REAL name, email, phone, LinkedIn, GitHub, portfolio from the original resume — do NOT make these up
- If a section does not exist in the original resume (e.g., no certifications, no projects), return an empty array [] for that field
- Every experience bullet MUST have quantified metrics (%, numbers, scale)
- Use strong action verbs (Architected, Spearheaded, Optimized, Orchestrated)
- Remove filler words and vague descriptions

ONE-PAGE STRICT CONSTRAINTS (CRITICAL - DO NOT EXCEED 1 PAGE):
- The content MUST fit firmly on ONE single A4 page. Do NOT over-generate text.
- Summary: 2 concise sentences.
- Experience: MAX 3 positions. Each position MAX 3-4 bullets. Keep bullets punchy (1 line each).
- Projects: MAX 2-3 projects. Each project MAX 2 bullets.
- Skills: Combine into compact categories. Do not list every single minor skill, only the most relevant.
- Education: Keep to 1 line per entry.
- Certifications: MAX 3 most relevant ones.
- If the original resume has more content than this, you MUST aggressively cut older or less impactful entries to ensure it fits on one page. Do not include a 4th job or 4th project under any circumstance.

- ATS-friendly: no tables, no graphics, standard section headers
- Add relevant keywords for the target role`;
