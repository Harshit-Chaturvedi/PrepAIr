import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(request) {
  try {
    const { fileData } = await request.json();
    const buffer = Buffer.from(fileData, 'base64');
    const data = await pdf(buffer);
    const text = data.text;
    
    // Extract skills via keyword matching
    const techKeywords = ['JavaScript','TypeScript','Python','Java','C++','React','Angular','Vue','Node.js','Express','Django','Flask','Spring','AWS','Azure','GCP','Docker','Kubernetes','MongoDB','PostgreSQL','MySQL','Redis','GraphQL','REST','CI/CD','Git','Linux','TensorFlow','PyTorch','SQL','NoSQL','Microservices','Agile','Scrum','HTML','CSS','Tailwind','Next.js','Firebase','Terraform','Jenkins','Kafka','RabbitMQ','Elasticsearch','Nginx','Apache','Figma','Jira','Confluence'];
    const foundSkills = techKeywords.filter(k => text.toLowerCase().includes(k.toLowerCase()));
    
    // Estimate experience
    const yearMatches = text.match(/20\d{2}/g) || [];
    const years = yearMatches.map(Number);
    const expYears = years.length >= 2 ? Math.max(...years) - Math.min(...years) : 0;
    
    return NextResponse.json({ text, skills: foundSkills, experienceYears: expYears });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to parse PDF: ' + error.message }, { status: 500 });
  }
}
