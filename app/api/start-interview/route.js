import { NextResponse } from 'next/server';
import { getModel, INTERVIEWER_SYSTEM_PROMPT } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { resumeText, role, duration, questionCount } = await request.json();
    const model = getModel();
    
    const prompt = `${INTERVIEWER_SYSTEM_PROMPT}

--- CANDIDATE RESUME ---
${resumeText}
--- END RESUME ---

Target Role: ${role}
Interview Duration: ${duration} minutes
Total Questions to Ask: ${questionCount}

You are starting the interview now. Greet the candidate warmly by name (if found in resume), introduce yourself as Sarah Mitchell, briefly mention you'll be conducting a ${duration}-minute technical interview for the ${role} position, and then ask them to introduce themselves. Say something like: "Before we begin, could you please tell me a little about yourself — your background, what you're currently working on, and what excites you about this role?"

Do NOT ask any technical question yet. Only greet and ask for their introduction.`;

    const result = await model.generateContent(prompt);
    const question = result.response.text();
    
    const conversationHistory = [
      { role: 'user', parts: [{ text: prompt }] },
      { role: 'model', parts: [{ text: question }] }
    ];
    
    return NextResponse.json({ question, conversationHistory });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start interview: ' + error.message }, { status: 500 });
  }
}
