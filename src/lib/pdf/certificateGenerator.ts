import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface CertificatePdfData {
  verificationId: string;
  seekerName: string;
  courseTitle: string;
  learningPathTitle?: string;
  issueDate?: any;
  quizScore?: number | null;
}

/**
 * Format date nicely for the certificate
 */
function formatDate(dateVal: any): string {
  if (!dateVal) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Builds the high-resolution landscape A4 PDF document for a THENIJOBS certificate
 */
export async function buildCertificatePdf(data: CertificatePdfData): Promise<jsPDF> {
  const Constructor = (jsPDF as any).jsPDF || jsPDF;
  const doc = new Constructor({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const centerX = pageWidth / 2;

  // 1. Background fill
  doc.setFillColor(254, 255, 254);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Ornate Double Borders
  // Outer Emerald Border
  doc.setDrawColor(5, 150, 105); // #059669
  doc.setLineWidth(1.8);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

  // Inner Gold Border
  doc.setDrawColor(217, 119, 6); // #D97706
  doc.setLineWidth(0.6);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26, 'S');

  // Corner decorative marks
  const corners = [
    [15, 15],
    [pageWidth - 15, 15],
    [15, pageHeight - 15],
    [pageWidth - 15, pageHeight - 15],
  ];
  doc.setFillColor(217, 119, 6);
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 1.2, 'F');
  });

  // 3. Organization Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105);
  doc.text('THENIJOBS CAREER ACADEMY', centerX, 26, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SKILL DEVELOPMENT & PROFESSIONAL CERTIFICATION CELL • THENI, TAMIL NADU', centerX, 31, { align: 'center' });

  // 4. Main Certificate Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('CERTIFICATE OF ACHIEVEMENT', centerX, 44, { align: 'center' });

  // Thin decorative flourish under title
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.line(centerX - 45, 48, centerX + 45, 48);
  doc.setFillColor(217, 119, 6);
  doc.circle(centerX, 48, 1, 'F');

  // 5. Presentation text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('THIS IS PROUDLY PRESENTED TO', centerX, 58, { align: 'center' });

  // 6. Candidate Name
  const candidateName = data.seekerName?.trim().toUpperCase() || 'STUDENT OF EXCELLENCE';
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(candidateName, centerX, 72, { align: 'center' });

  // Underline beneath candidate name
  const nameWidth = doc.getTextWidth(candidateName);
  const underlinePadding = 8;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(centerX - (nameWidth / 2) - underlinePadding, 76, centerX + (nameWidth / 2) + underlinePadding, 76);

  // 7. Statement of Completion
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'for successfully completing the curriculum and demonstrating verified competency in the course',
    centerX,
    86,
    { align: 'center' }
  );

  // 8. Course Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(5, 150, 105); // emerald-600
  const courseTitle = data.courseTitle || 'Professional Certification Course';
  doc.text(courseTitle, centerX, 97, { align: 'center' });

  // 9. Optional Learning Path & Assessment Score
  let metaY = 106;
  if (data.learningPathTitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Career Roadmap: ${data.learningPathTitle}`, centerX, metaY, { align: 'center' });
    metaY += 6;
  }

  if (typeof data.quizScore === 'number' && data.quizScore > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(`Assessment Score: ${data.quizScore}% • Verified Pass`, centerX, metaY, { align: 'center' });
  }

  // 10. QR Code for Instant Authentic Verification
  const verifyUrl = `https://thenijobs.com/verify-certificate/${encodeURIComponent(data.verificationId)}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 160,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const qrSize = 26;
    const qrX = centerX - (qrSize / 2);
    const qrY = 126;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SCAN TO VERIFY CREDENTIAL', centerX, qrY + qrSize + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`ID: ${data.verificationId}`, centerX, qrY + qrSize + 7.5, { align: 'center' });
  } catch (err) {
    console.warn('[PDF Cert] Failed to embed QR code:', err);
  }

  // 11. Footer Signatures & Date
  const bottomY = 175;

  // Left side: Date of Issue
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Date of Issuance', 45, bottomY - 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(data.issueDate), 45, bottomY, { align: 'center' });
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(25, bottomY + 2, 65, bottomY + 2);

  // Right side: Director / Verification Seal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Authority', pageWidth - 45, bottomY - 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(5, 150, 105);
  doc.text('THENIJOBS VERIFICATION CELL', pageWidth - 45, bottomY, { align: 'center' });
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(pageWidth - 70, bottomY + 2, pageWidth - 20, bottomY + 2);

  // Bottom Security Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This credential is tamper-proof, recorded in the THENIJOBS registry, and independently verifiable at thenijobs.com/verify-certificate',
    centerX,
    195,
    { align: 'center' }
  );

  return doc;
}

/**
 * Direct client helper to download the certificate as a PDF file
 */
export async function downloadCertificatePdf(
  data: CertificatePdfData,
  filename?: string
): Promise<void> {
  const doc = await buildCertificatePdf(data);
  const cleanName = (data.seekerName || 'Learner').replace(/[^a-zA-Z0-9]/g, '_');
  const actualFilename = filename || `THENIJOBS_Certificate_${cleanName}_${data.verificationId}.pdf`;
  doc.save(actualFilename);
}
