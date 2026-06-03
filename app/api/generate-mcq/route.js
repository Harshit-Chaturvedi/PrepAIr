import { NextResponse } from 'next/server';
import { getModel } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { skills, role, count } = await request.json();
    const model = getModel();
    
    const prompt = `Generate exactly ${count} multiple-choice questions for a ${role} interview.
The candidate has these skills: ${skills.join(', ')}.

Make questions technical and relevant to their skill set. Vary difficulty.

Return ONLY valid JSON array:
[
  {
    "question": "<question text>",
    "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
    "correctIndex": <0-3>
  }
]

No markdown, no explanation — ONLY the JSON array.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(text);
    
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate MCQs: ' + error.message }, { status: 500 });
  }
}
