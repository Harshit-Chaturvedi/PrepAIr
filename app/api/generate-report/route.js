import { NextResponse } from 'next/server';
import { getModel, REPORT_PROMPT } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { transcript, resumeText, role } = await request.json();
    const model = getModel();
    
    const prompt = `${REPORT_PROMPT}

--- CANDIDATE RESUME ---
${resumeText}
--- END RESUME ---

Target Role: ${role}

--- INTERVIEW TRANSCRIPT ---
${transcript.map((t, i) => `${t.role === 'ai' ? 'Sarah (Interviewer)' : 'Candidate'}: ${t.text}`).join('\n\n')}
--- END TRANSCRIPT ---

Generate the performance report JSON now. Return ONLY valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const report = JSON.parse(text);
    
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report: ' + error.message }, { status: 500 });
  }
}
