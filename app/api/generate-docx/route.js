import { NextResponse } from 'next/server';
import HTMLToDOCX from 'html-to-docx';

export async function POST(request) {
  try {
    const { html, title } = await request.json();
    
    const docxBuffer = await HTMLToDOCX(html, null, {
      title: title || 'Resume',
      margins: {
        top: 720, // 0.5 inch in twips
        right: 720,
        bottom: 720,
        left: 720,
        header: 720,
        footer: 720,
        gutter: 0
      }
    });

    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${(title || 'resume').replace(/\s+/g, '_')}.docx"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate DOCX: ' + error.message }, { status: 500 });
  }
}
