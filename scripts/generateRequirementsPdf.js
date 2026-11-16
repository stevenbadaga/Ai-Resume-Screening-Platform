const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, 'requirements_matrix.html');
const outputPath = path.resolve(__dirname, '..', 'CODAFRIQA_Requirements_Traceability_Matrix.pdf');

async function main() {
  console.log('Reading HTML matrix from:', htmlPath);
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  console.log('Launching browser (MS Edge channel)...');
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Setting HTML content for PDF rendering...');
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  console.log('Generating PDF to:', outputPath);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '10mm',
      right: '10mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 7.5pt; color: #64748B; width: 100%; display: flex; justify-content: space-between; padding: 0 10mm; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <span>CODAFRIQA &bull; AI Resume Screening Platform &bull; Requirements Traceability Matrix</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `
  });

  await browser.close();
  console.log('PDF generation complete! Successfully saved at:', outputPath);
}

main().catch((err) => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
