import { jsPDF } from 'jspdf';
import type { LeaveRequest } from '../context/DatabaseContext';

export const generateGatePassPDF = async (request: LeaveRequest): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 size is ideal for slips/passes
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Draw border
  doc.setDrawColor(2, 132, 199); // primary-500
  doc.setLineWidth(1.5);
  doc.rect(5, 5, width - 10, height - 10);
  
  doc.setDrawColor(226, 232, 240); // slate-200 secondary border
  doc.setLineWidth(0.5);
  doc.rect(7, 7, width - 14, height - 14);

  // Header Background
  doc.setFillColor(2, 132, 199);
  doc.rect(7.5, 7.5, width - 15, 20, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CAMPUS GATE PASS SYSTEM', width / 2, 14, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('EMERGENCY LEAVE PERMIT', width / 2, 20, { align: 'center' });

  // Pass ID Section
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${request.pass_id || 'TEMP-PASS-ID'}`, width / 2, 36, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('PASS ID (SCAN OR ENTER AT GATE)', width / 2, 40, { align: 'center' });

  // Draw divider
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 43, width - 10, 43);

  // Student Details
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('STUDENT INFORMATION', 12, 49);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Name:`, 12, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.student?.full_name || 'N/A'}`, 36, 55);

  doc.setFont('helvetica', 'normal');
  doc.text(`Roll Number:`, 12, 61);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.student?.roll_number || 'N/A'}`, 36, 61);

  doc.setFont('helvetica', 'normal');
  doc.text(`Department:`, 12, 67);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.student?.department || 'N/A'}`, 36, 67);

  // Draw QR code placeholder (offline vector fallback)
  // Generates a mock QR code image using nested rectangle paths in the PDF
  const qrX = width - 42;
  const qrY = 47;
  const qrSize = 30;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.rect(qrX, qrY, qrSize, qrSize); // outer box
  
  // Position the 3 major QR squares
  doc.setFillColor(15, 23, 42);
  doc.rect(qrX + 2, qrY + 2, 7, 7, 'F');
  doc.rect(qrX + qrSize - 9, qrY + 2, 7, 7, 'F');
  doc.rect(qrX + 2, qrY + qrSize - 9, 7, 7, 'F');
  
  // Draw some randomized inner blocks to simulate QR content
  doc.rect(qrX + 12, qrY + 4, 3, 3, 'F');
  doc.rect(qrX + 16, qrY + 8, 4, 2, 'F');
  doc.rect(qrX + 6, qrY + 12, 5, 2, 'F');
  doc.rect(qrX + 12, qrY + 13, 2, 4, 'F');
  doc.rect(qrX + 18, qrY + 15, 3, 3, 'F');
  doc.rect(qrX + 4, qrY + 17, 3, 2, 'F');
  doc.rect(qrX + 10, qrY + 20, 6, 2, 'F');
  doc.rect(qrX + 17, qrY + 21, 2, 5, 'F');
  doc.rect(qrX + 22, qrY + 10, 4, 4, 'F');
  doc.rect(qrX + 21, qrY + 22, 5, 2, 'F');
  doc.rect(qrX + 10, qrY + 25, 4, 3, 'F');

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 80, width - 10, 80);

  // Leave Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LEAVE DETAILS', 12, 86);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Reason Category:`, 12, 92);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.reason_category.toUpperCase()}`, 45, 92);

  doc.setFont('helvetica', 'normal');
  doc.text(`Date of Leave:`, 12, 98);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.requested_date}`, 45, 98);

  doc.setFont('helvetica', 'normal');
  doc.text(`Departure Time:`, 12, 104);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.time_out}`, 45, 104);

  doc.setFont('helvetica', 'normal');
  doc.text(`Expected Back:`, 12, 110);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.time_expected_back || 'Not returning today'}`, 45, 110);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 115, width - 10, 115);

  // Signatures / Approvals
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('APPROVAL SIGNATURES', 12, 121);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Faculty:`, 12, 127);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.faculty?.full_name || 'Confirmed by Faculty'}`, 28, 127);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`(Parent Contact Confirmed: ${request.faculty_confirmed_parent ? 'YES' : 'NO'})`, 28, 131);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`HOD:`, 12, 137);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.hod?.full_name || 'Approved by HOD'}`, 28, 137);

  // Footer Disclaimer
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 144, width - 10, 144);
  
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.text('This is a secure, system-generated digital pass. Valid only on the date and times printed above.', width / 2, 150, { align: 'center' });
  doc.text('Gate officer must verify the Pass ID in the college registry before allowing egress.', width / 2, 153, { align: 'center' });

  // Output as Blob
  return doc.output('blob');
};
