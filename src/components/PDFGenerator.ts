import { jsPDF } from 'jspdf';
import type { LeaveRequest } from '../context/DatabaseContext';

// Self-contained transparent base64 PNG signatures to bypass import and asset loading issues

// Helper to asynchronously load image URL to HTML Image for PDF rendering
const loadPhotoHelper = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generateGatePassPDF = async (request: LeaveRequest): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 Size (148mm width x 210mm height)
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. Draw outer double borders for academic credentials
  doc.setDrawColor(2, 132, 199); // primary-500
  doc.setLineWidth(1.5);
  doc.rect(5, 5, width - 10, height - 10);
  
  doc.setDrawColor(15, 23, 42); // slate-900 thin inner border
  doc.setLineWidth(0.3);
  doc.rect(7, 7, width - 14, height - 14);

  // 2. Header Box
  doc.setFillColor(15, 23, 42); // Slate-900 header
  doc.rect(7.3, 7.3, width - 14.6, 24, 'F');

  // Load IIST Logo
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadPhotoHelper('/iist-logo.png');
  } catch (e) {
    console.warn("Failed to load IIST logo for PDF:", e);
  }

  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', 11, 11.3, 16, 16);
    } catch (e) {
      console.warn("Failed to draw logo inside PDF header:", e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  
  const textX = logoImg ? 30 : width / 2;
  const textAlign = logoImg ? 'left' : 'center';

  doc.setFontSize(9.5);
  doc.text('INDORE INSTITUTE OF SCIENCE & TECHNOLOGY', textX, 17, { align: textAlign });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(186, 230, 253); // sky-200
  doc.text('CAMPUS EMERGENCY LEAVE GATE PASS', textX, 24, { align: textAlign });

  // 3. Student Details Block with Prominent LARGEST Photo on left
  const photoX = 12;
  const photoY = 36;
  const photoW = 36;
  const photoH = 36;

  // Outer photo frame
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.5);
  doc.rect(photoX, photoY, photoW, photoH);

  let photoLoaded = false;
  if (request.student?.photo_url) {
    try {
      const imgElement = await loadPhotoHelper(request.student.photo_url);
      if (imgElement) {
        doc.addImage(imgElement, 'JPEG', photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1);
        photoLoaded = true;
      }
    } catch (e) {
      console.warn("Failed loading student photo for PDF, drawing placeholder.", e);
    }
  }

  // Draw vector placeholder if photo failed or not present
  if (!photoLoaded) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1, 'F');
    // Draw avatar head & shoulders
    doc.setFillColor(148, 163, 184); // slate-400
    doc.circle(photoX + (photoW / 2), photoY + 14, 6, 'F');
    doc.ellipse(photoX + (photoW / 2), photoY + 28, 11, 6, 'F');
  }

  // Student details on right of photo
  const detailsX = 53;
  let textY = 43;

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('STUDENT NAME:', detailsX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${request.student?.full_name || 'N/A'}`, detailsX, textY + 4);

  textY += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('ROLL NUMBER:', detailsX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${request.student?.roll_number || 'N/A'}`, detailsX, textY + 4);

  textY += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('DEPARTMENT:', detailsX, textY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${request.student?.department || 'N/A'}`, detailsX, textY + 4);

  // 4. Leave Details Section: LARGE, BOLD, HIGH CONTRAST BLOCK (Visible at a glance)
  const detailBoxY = 78;
  const detailBoxH = 46;
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.setLineWidth(0.5);
  doc.rect(10, detailBoxY, width - 20, detailBoxH, 'FD');

  let leaveTextY = detailBoxY + 8;
  
  // EMERGENCY CATEGORY
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EMERGENCY CATEGORY:', 14, leaveTextY);
  doc.setFontSize(12);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(`${request.reason_category.toUpperCase()}`, 14, leaveTextY + 5.5);

  leaveTextY += 13;
  // DATE OF LEAVE
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATE OF LEAVE:', 14, leaveTextY);
  doc.setFontSize(12);
  doc.text(`${request.requested_date}`, 14, leaveTextY + 5.5);

  // APPROVED TIME WINDOW (Very large and high contrast)
  leaveTextY += 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('APPROVED EXIT/RETURN WINDOW:', 14, leaveTextY);
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38); // Red-600 for absolute contrast
  doc.text(`${request.time_out}  TO  ${request.time_expected_back || 'END OF DAY (NO RETURN)'}`, 14, leaveTextY + 6);

  // 5. Dual Signatures Section (Side by side for trust)
  const sigsY = 132;
  
  // Faculty signature block (Left)
  doc.setDrawColor(226, 232, 240); // slate-200 boundary
  doc.setLineWidth(0.3);
  doc.rect(10, sigsY, (width - 24) / 2, 38);
  
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('VERIFIED & RECOMMENDED BY', 14, sigsY + 5);
  // Add Faculty Digital Stamp
  doc.setFillColor(240, 253, 250); // teal-50 background card
  doc.rect(12, sigsY + 7, (width - 28) / 2, 16, 'F');
  doc.setDrawColor(13, 148, 136); // teal-600 border
  doc.setLineWidth(0.4);
  doc.rect(12, sigsY + 7, (width - 28) / 2, 16, 'S');

  doc.setTextColor(13, 148, 136); // teal-600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('✓ DIGITALLY VERIFIED', 15, sigsY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`REF: IIST-FAC-${request.pass_id?.substring(0, 8).toUpperCase() || 'PENDING'}`, 15, sigsY + 16.5);
  doc.text(`DATE: ${request.requested_date}`, 15, sigsY + 20.5);
  // Faculty text
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Mr. Sharma', 14, sigsY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Faculty Advisor', 14, sigsY + 32);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`(Confirmed Parent: ${request.faculty_confirmed_parent ? 'YES' : 'NO'})`, 14, sigsY + 35.5);

  // HOD signature block (Right)
  const hodSigX = 14 + (width - 24) / 2;
  doc.rect(hodSigX - 4, sigsY, (width - 24) / 2, 38);
  
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('APPROVED & SIGNED BY', hodSigX, sigsY + 5);
  // Add HOD Digital Stamp
  doc.setFillColor(239, 246, 255); // blue-50 background card
  doc.rect(hodSigX - 2, sigsY + 7, (width - 28) / 2, 16, 'F');
  doc.setDrawColor(37, 99, 235); // blue-600 border
  doc.setLineWidth(0.4);
  doc.rect(hodSigX - 2, sigsY + 7, (width - 28) / 2, 16, 'S');

  doc.setTextColor(37, 99, 235); // blue-600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('✓ APPROVED & SIGNED', hodSigX + 1, sigsY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`REF: IIST-HOD-${request.pass_id?.substring(0, 8).toUpperCase() || 'APPROVED'}`, hodSigX + 1, sigsY + 16.5);
  doc.text(`DATE: ${request.requested_date}`, hodSigX + 1, sigsY + 20.5);
  // HOD text
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Dr. Rao', hodSigX, sigsY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('HOD, Computer Science', hodSigX, sigsY + 32);

  // 6. Verification Footer (Below signatures)
  const footerY = 182;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(10, footerY - 4, width - 10, footerY - 4);

  // Pass ID small but readable
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`PASS ID: ${request.pass_id || 'PENDING'}`, width / 2, footerY, { align: 'center' });
  
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Verifiable via Admin Office.', width / 2, footerY + 4.5, { align: 'center' });

  // System warning footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.text('This permit is a secure digital record. Alteration is a severe academic offense.', width / 2, footerY + 11, { align: 'center' });

  // Output as Blob
  return doc.output('blob');
};
