import { NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(req: Request) {
  const { pages, language } = await req.json();

  try {
    const zip = new JSZip();

    // Add mimetype file
    zip.file('mimetype', 'application/epub+zip');

    // Add META-INF directory
    const metaInf = zip.folder('META-INF');
    metaInf?.file('container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');

    // Add OEBPS directory
    const oebps = zip.folder('OEBPS');

    // Add content.opf file
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
    <package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:title>Book in ${language}</dc:title>
        <dc:creator>Generated Book</dc:creator>
        <dc:language>${language}</dc:language>
      </metadata>
      <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="style" href="style.css" media-type="text/css"/>
        ${pages.map((_: any, index: number) => `<item id="page${index + 1}" href="page${index + 1}.xhtml" media-type="application/xhtml+xml"/>`).join('\n')}
      </manifest>
      <spine toc="ncx">
        ${pages.map((_: any, index: number) => `<itemref idref="page${index + 1}"/>`).join('\n')}
      </spine>
    </package>`;
    oebps?.file('content.opf', contentOpf);

    // Add toc.ncx file
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
      <head>
        <meta name="dtb:uid" content="BookID"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
      </head>
      <docTitle><text>Book in ${language}</text></docTitle>
      <navMap>
        ${pages.map((_: any, index: number) => `
          <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
            <navLabel><text>Page ${index + 1}</text></navLabel>
            <content src="page${index + 1}.xhtml"/>
          </navPoint>
        `).join('\n')}
      </navMap>
    </ncx>`;
    oebps?.file('toc.ncx', tocNcx);

    // Add CSS file
    const css = `
      body {
        margin: 0;
        padding: 0 5%;
      }
      p {
        margin: 0;
        text-indent: 1em;
      }
      img {
        max-width: 100%;
        height: auto;
      }
    `;
    oebps?.file('style.css', css);

    // Add content pages
    pages.forEach((page: any, pageIndex: number) => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <title>Page ${pageIndex + 1}</title>
          <link rel="stylesheet" type="text/css" href="style.css" />
        </head>
        <body>
          ${page.blocks.map((block: any) => {
            if (block.type === 'text') {
              return `<p>${block.content}</p>`;
            } else if (block.type === 'image' && typeof block.content === 'object') {
              return `<img src="data:image/png;base64,${block.content.b64_json}" alt="Image" />`;
            }
            return '';
          }).join('\n')}
        </body>
      </html>`;
      oebps?.file(`page${pageIndex + 1}.xhtml`, content);
    });

    const epubBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    return new NextResponse(epubBuffer, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="book_${language}.epub"`
      }
    });
  } catch (error) {
    console.error('Error generating EPUB:', error);
    return NextResponse.json({ error: 'Failed to generate EPUB' }, { status: 500 });
  }
}
