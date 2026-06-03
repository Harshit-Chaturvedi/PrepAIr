import { NextResponse } from 'next/server';
import { getModel } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { answer, conversationHistory, questionNumber, totalQuestions } = await request.json();
    const model = getModel();
    
    const isLast = questionNumber >= totalQuestions;
    
    const prompt = `The candidate answered: "${answer}"

Instructions:
1. First, provide brief constructive coaching on their answer (2-3 sentences max). If the answer was missing important points, say something like "You could also mention [specific point] to make your answer stronger." If it was good, acknowledge what was strong.
2. ${isLast ? 'This was the final question. Thank the candidate and say you will now prepare their performance report.' : 'Then ask your next interview question. Remember: NEVER repeat a topic you already covered. Ask about a completely different area.'}

Format your response EXACTLY like this:
[COACHING]: <your coaching feedback>
[QUESTION]: <your next question OR "END" if this was the last question>`;

    const history = [...conversationHistory];
    history.push({ role: 'user', parts: [{ text: prompt }] });
    
    const chat = model.startChat({ history: conversationHistory });
    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();
    
    // Parse response
    const coachingMatch = responseText.match(/\[COACHING\]:\s*(.+?)(?=\[QUESTION\]|$)/s);
    const questionMatch = responseText.match(/\[QUESTION\]:\s*(.+)/s);
    
    const coaching = coachingMatch ? coachingMatch[1].trim() : responseText;
    const nextQuestion = questionMatch ? questionMatch[1].trim() : '';
    const isComplete = isLast || nextQuestion.toUpperCase().includes('END');
    
    history.push({ role: 'model', parts: [{ text: responseText }] });
    
    return NextResponse.json({
      coaching,
      nextQuestion: isComplete ? '' : nextQuestion,
      conversationHistory: history,
      isComplete
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process answer: ' + error.message }, { status: 500 });
  }
}
