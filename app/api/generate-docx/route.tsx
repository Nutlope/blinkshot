import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';
import { PageContent } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { pages, title, language } = await request.json();
    console.log('Received request to generate DOCX:', { title, language, pageCount: pages.length });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 24 })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    for (const page of pages) {
      const pageChildren = [];

      for (const block of page.blocks) {
        if (block.type === 'text') {
          pageChildren.push(
            new Paragraph({
              children: [new TextRun(stripHtmlTags(block.content))],
            }),
          );
        } else if (block.type === 'image' && block.content) {
          try {
            const base64Data = block.content.b64_json.split(',').pop() || '';
            const imageBuffer = Buffer.from(base64Data, 'base64');

            pageChildren.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: 500,
                      height: 300,
                    },
                  }),
                ],
              }),
            );
          } catch (imageError) {
            console.error('Error adding image:', imageError);
            pageChildren.push(
              new Paragraph({
                children: [new TextRun('Error: Unable to add image')],
              }),
            );
          }
        }
      }

      doc.addSection({
        properties: {},
        children: pageChildren,
      });
    }

    const buffer = await Packer.toBuffer(doc);
    console.log('Generated DOCX buffer size:', buffer.length, 'bytes');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="storybook_${language || 'English'}.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json({ error: 'Failed to generate DOCX', details: error.message }, { status: 500 });
  }
}

function stripHtmlTags(html: string) {
  return html.replace(/<[^>]*>?/gm, '');
}
