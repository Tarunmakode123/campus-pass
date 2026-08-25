import { jsPDF } from 'jspdf';
import type { LeaveRequest } from '../context/DatabaseContext';

// Self-contained transparent base64 PNG signatures to bypass import and asset loading issues
const FACULTY_SIG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAQ6xXmAAAACXBIWXMAAAsTAAALEwEAmpwYAAACeklEQVR4nO2aTUsbURSGn3EzE6NJtE1/QGl/QehCunDXlX9Q3HRVupG4ceV/EFy4Kat+gC4KaSFu2o3Qn9BqU5s0qSZNNDNxLp5J6kxskkmaO455DwzD4Z4z58y9M/ee9w4wGAwGg8FgMBiMwSCYy+Vms9nsepKxO7C5udkq/x4B+4CXZLNZ9o8nSj2dTr+1tLTUA/vAHiASjX452Cif6KMAQdls9kksFjMCwRCLxZZ0X+y2eDweq/VzYAcwiGg8/jDYKMPoowFhOzs7LwKBgAmEgmAw+Ez3xmGLjMVi8UY/B3YAg4jG4/dDjfKIPgoQtr29vTcWi90EYnE4HHt6Nn65SCSSqfVzYAcwimhs7EG4UT7RRwHCNjc3H4VCIROIRU9Pz5WWDV+uUCika/0c2AGMIhodG4Ub5RN99CGkUCjcDQRDHMc51rJhNnN+fr766yYQ/Ygexg6HG+UTfRSgs5bW1dXVBIIhFos1WzZ8uca1BGBmZoZnz58zMzNDMplE13UikQjn5+cALC0tAWC73f7/bFjZcO5fW1sjGAzy+vVrdnZ2SKfTRCIRwuHwdpE6Ozuz/Vv1NMo3eRk6c2ltb28D1B/Q4uIiiUSCx48fc3FxwfLysla9q6uLZDKJruteTzZ2wX1ra2vk83nS6TR3d3cAa1q+fPnydmdnp/o7B/aAPUA0Gv1ysFE+0UcBIjY2Nl4GAgETFIFgMPhM98Vui8fjsco/B3YAg4jG4w+DjTKIPgoQtrGx8TIQCJhAKA4hPT0bv1wkksh6/RzYAYwiyvo43Cif6KMAIZubm49CoZAJhKKnB8dxjrVs+HKFQiFd6+fADmAU0dijcKN8oo8CBG1ubu6NCAQhjud5x1o2zGZarVZ11xMIQpDjeUe6L/K/65Nq9U01vU01P1XTSzU9Vv1m/7s+g8FgMBgMBoPBYDAY/gf/AD04T/d33kG7AAAAAElFTkSuQmCC";
const HOD_SIG_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAQ6xXmAAAACXBIWXMAAAsTAAALEwEAmpwYAAACpklEQVR4nO2bS08TURSGz9zp9MFIWwG1lKqA8hAUPgrxoSEaN8bExI0r/4Dgwk1Z9Qe4KKQFN27UBF9AbaUtlEdbm5lOz9x7Lp4KLTXTaWca/L7JZHLuuffmO+eemTvAwGAwGAwGg8FgMBiDwSDYy+VzjxP5fHsQdgc2NjZa5d8D4DiwA8/L5/PvH42Verna+kpjY6M9DqwDm4BQIvH60UipE0cKEPv5fP5JJBK2QIgRiUSedS92Ozwejde6H1sHDGGhRPKVo5FSJ44UIF5NTc0XgUDgGggb4WDgZfdiD8LhYPBkvZ9j64QhJJRwfj9S6sSRBMStpqbmi2AwcBXCZmdn5+n6eTAYPN28n2PrgCEklHBCqRNHCuBtQ9P1tra2XhD8qYdZ9c/MzDzWs+HzxWKxpHo/x9YBQ0go4fZipNSJIwnwmqV1dXX9IBAQIPZ7eXn52387PT1t5fn5OZufn78nE9vP1Nra2n1/O7gLzlpeXqZSqdD5+TktLS0B1bTcvZqaurkZHgeGkFDC7Y6ROnGkALG/WCw+CwQCtmEgxIj+YODFv/v1aDS8V+9nfRwwhIQS9j8ZKXXiSAFif3Nz81UgELAGYXP1z9wMBoPDmvdzbB0whIQSHu4YKXXiSAFiv1Ao3ItGw9tAOP00NDjY07P+c32eWp3/PZtpagoNbAPxdDqdf6+7Iv+Zvn/4pPof2jObaWqKzTQ1xWaanmKzp+v1GQwGg8FgMBiMwSCYy+VzjxP5fHsQdgc2NjZa5d8D4DiwA8/L5/PvH42Verna+kpjY6M9DqwDm4BQIvH60UipE0cKEPv5fP5JJBK2QIgRiUSedS92Ozwejde6H1sHDGGhRPKVo5FSJ44UIF5NTc0XgUDgGggb4WDgZfdiD8LhYPBkvZ9j64QhJJRwfj9S6sSRBMStpqbmi2AwcBXCZmdn5+n6eTAYPN28n2PrgCEklHBCR/+Cf00nsw7fG+7gAAAAABJRU5ErkJggg==";

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

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CAMPUS EMERGENCY GATE PASS', width / 2, 16, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253); // sky-200
  doc.text('OFFICIAL VERIFIED DEPARTURE PERMIT', width / 2, 23, { align: 'center' });

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
  // Add Faculty Sig
  doc.addImage(FACULTY_SIG_BASE64, 'PNG', 16, sigsY + 7, 34, 13);
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
  // Add HOD Sig
  doc.addImage(HOD_SIG_BASE64, 'PNG', hodSigX + 2, sigsY + 7, 34, 13);
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
