import { NextResponse } from 'next/server';
import { getModel, RESUME_ENHANCE_PROMPT } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { resumeText, targetTier, targetRole } = await request.json();
    const model = getModel();
    
    const prompt = `${RESUME_ENHANCE_PROMPT}

Target Company Tier: ${targetTier || 'FAANG / Big Tech'}
Target Role: ${targetRole || 'Software Engineer'}

--- ORIGINAL RESUME ---
${resumeText}
--- END RESUME ---

Rewrite this resume now. Return ONLY valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const enhanced = JSON.parse(text);
    
    return NextResponse.json(enhanced);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to enhance resume: ' + error.message }, { status: 500 });
  }
}
