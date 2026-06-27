'use client';

/**
 * Company PDF Profile Download
 * Uses html2canvas to capture the company profile section and convert to PDF via jsPDF
 */
export async function downloadCompanyPdf(companyName: string, elementId: string = 'company-profile-content') {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Company profile content element not found');
    }

    const html2canvas = (await import('html2canvas-pro')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;

    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = (imgHeight * contentWidth) / imgWidth;

    const pdf = new jsPDF({
      orientation: contentHeight > pdfHeight ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pdfWidth, 12, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text('THENIJOBS — Verified Business Profile', margin, 8);
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pdfWidth - margin - 40, 8);

    // Content
    const startY = 15;
    const availableHeight = pdfHeight - startY - 15; // Leave space for footer
    
    if (contentHeight <= availableHeight) {
      // Fits on one page
      pdf.addImage(imgData, 'PNG', margin, startY, contentWidth, contentHeight);
    } else {
      // Multi-page
      let remainingHeight = contentHeight;
      let sourceY = 0;
      let page = 0;

      while (remainingHeight > 0) {
        if (page > 0) {
          pdf.addPage();
          // Repeat header
          pdf.setFillColor(15, 23, 42);
          pdf.rect(0, 0, pdfWidth, 12, 'F');
          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          pdf.text(`THENIJOBS — ${companyName} (Page ${page + 1})`, margin, 8);
        }

        const pageContentHeight = Math.min(remainingHeight, availableHeight);
        
        // Create a cropped canvas for this page section
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = (pageContentHeight / contentHeight) * canvas.height;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, pageCanvas.height,
            0, 0, pageCanvas.width, pageCanvas.height
          );
          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', margin, startY, contentWidth, pageContentHeight);
        }

        sourceY += pageCanvas.height;
        remainingHeight -= pageContentHeight;
        page++;
      }
    }

    // Footer on last page
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFillColor(241, 245, 249); // slate-100
      pdf.rect(0, pdfHeight - 10, pdfWidth, 10, 'F');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text('thenijobs.in — Tamil Nadu\'s Local Business & Jobs Platform', margin, pdfHeight - 4);
      pdf.text(`Page ${i} of ${totalPages}`, pdfWidth - margin - 20, pdfHeight - 4);
    }

    const safeName = companyName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    pdf.save(`${safeName}_THENIJOBS_Profile.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}
