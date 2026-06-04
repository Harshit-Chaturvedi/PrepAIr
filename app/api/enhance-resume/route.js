import { NextResponse } from 'next/server';
import { getModel, RESUME_ENHANCE_PROMPT } from '@/lib/gemini';

// Repair common AI JSON issues
function repairJSON(text) {
  // Strip markdown code fences
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Remove any text before the first { and after the last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  
  // Remove control characters (except newline, tab)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  
  // Fix unquoted property names:  { name: "value" } => { "name": "value" }
  text = text.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Fix single-quoted strings to double-quoted
  // Only replace single quotes that are used as string delimiters (after : or in arrays)
  text = text.replace(/:\s*'([^']*?)'/g, ': "$1"');
  
  // Remove trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, '$1');
  
  // Fix escaped newlines inside strings that might break JSON
  text = text.replace(/\\n/g, ' ');
  
  return text;
}

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

Rewrite this resume now. Return ONLY valid JSON — no markdown, no code fences, no explanations. Start with { and end with }. Use double quotes for all property names and string values.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Try parsing raw first, then try repair
    let enhanced;
    try {
      enhanced = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch (rawError) {
      console.warn('[JSON Repair] Raw parse failed, attempting repair...', rawError.message);
      const repaired = repairJSON(text);
      try {
        enhanced = JSON.parse(repaired);
      } catch (repairError) {
        console.error('[JSON Repair] Repair also failed:', repairError.message);
        console.error('[JSON Repair] Repaired text (first 500 chars):', repaired.substring(0, 500));
        throw new Error('AI returned invalid JSON. Please try again.');
      }
    }
    
    return NextResponse.json(enhanced);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to enhance resume: ' + error.message }, { status: 500 });
  }
}
