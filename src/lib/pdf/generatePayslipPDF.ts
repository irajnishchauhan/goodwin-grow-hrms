import { jsPDF } from 'jspdf';
import { SalarySlip, Tenant, Employee } from '@/lib/types';

/**
 * Converts Indian currency number to English words (e.g. 45000 -> "Rupees Forty-Five Thousand Only")
 */
export function numberToWordsIndian(num: number): string {
  if (!num || num === 0) return 'Rupees Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return singleDigits[n];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit ? ' ' + singleDigits[unit] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${singleDigits[hundred]} Hundred`;
      if (rest > 0) res += ' and ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let n = Math.floor(Math.abs(num));
  let result = '';

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  if (crore > 0) {
    result += `${convertTwoDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    result += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    result += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (remainder > 0) {
    result += `${convertThreeDigits(remainder)} `;
  }

  return `Rupees ${result.trim()} Only`;
}

/**
 * Generates and triggers download of a high-fidelity, professional Keka-style salary slip PDF.
 */
export function downloadPayslipPDF(
  slip: SalarySlip,
  tenant?: Tenant | null,
  employee?: Partial<Employee> | null
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Colors
  const darkNavy = [15, 23, 42];      // #0F172A
  const slateText = [51, 65, 85];     // #334155
  const mutedText = [100, 116, 139];  // #64748B
  const borderGray = [226, 232, 240]; // #E2E8F0
  const bgLight = [248, 250, 252];    // #F8FAFC
  const emerald = [5, 150, 105];      // #059669
  const emeraldBg = [236, 253, 245];  // #ECFDF5
  const emeraldBorder = [167, 243, 208]; // #A7F3D0
  const rose = [225, 29, 72];         // #E11D48

  let y = 14;

  // -------------------------------------------------------------
  // 1. COMPANY HEADER & BRANDING
  // -------------------------------------------------------------
  const companyName = tenant?.name || 'Goodwin Batteries Pvt Ltd';
  const companyAddress = tenant?.registeredAddress
    ? `${tenant.registeredAddress}, ${tenant.city || 'Indore'}, ${tenant.state || 'Madhya Pradesh'} - ${tenant.postalCode || '452012'}`
    : 'Second Floor, Shop No. 202, Samiksh Landmark, AB Road, Indore, MP 452012';
  const companyEmail = tenant?.businessEmail || 'info@goodwinbatteries.com';
  const companyPhone = tenant?.businessPhone || '+91 9667724411';
  const companyCode = tenant?.companyCode || 'GOODWIN-BAT-FLT';

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text(companyName, margin, y);

  // Payslip Month Pill on right
  const [yearStr, monthStr] = (slip.month || '2026-10').split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[parseInt(monthStr, 10) - 1] || 'October';
  const periodLabel = `PAYSLIP FOR ${monthName.toUpperCase()} ${yearStr}`;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const pillWidth = doc.getTextWidth(periodLabel) + 10;
  const pillX = pageWidth - margin - pillWidth;
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.roundedRect(pillX, y - 5, pillWidth, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(periodLabel, pillX + 5, y - 0.5);

  y += 5;
  // Subtitle / Industry
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(tenant?.industry || 'Electrical Equipment & Fleet Battery Systems', margin, y);

  y += 4.5;
  // Address
  doc.setFontSize(8);
  doc.text(companyAddress, margin, y);

  y += 4;
  // Contact details
  doc.text(`Email: ${companyEmail}  •  Phone: ${companyPhone}  •  Company Code: ${companyCode}`, margin, y);

  y += 4.5;
  // Horizontal divider
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // -------------------------------------------------------------
  // 2. EMPLOYEE INFORMATION GRID (KEKA STYLE 4-COLUMN)
  // -------------------------------------------------------------
  const gridHeight = 32;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, gridHeight, 2, 2, 'FD');

  const colWidth = contentWidth / 4;
  const paddingX = 4;
  const row1Y = y + 5.5;
  const row2Y = y + 14.5;
  const row3Y = y + 23.5;

  const empName = slip.employeeName || `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || 'Workforce Member';
  const empCode = slip.employeeCode || employee?.employeeCode || 'GOODWIN-001';
  const deptName = slip.departmentName || employee?.departmentName || 'Operations';
  const desigTitle = slip.designationTitle || employee?.designationTitle || 'Fleet Specialist';
  const joiningDate = slip.joiningDate || employee?.joiningDate || '2026-01-15';
  const bankName = slip.bankName || employee?.bankName || 'HDFC Bank';
  const bankAccount = slip.bankAccountNumber || employee?.bankAccountNumber || '•••••••• 4821';
  const pan = slip.panOrTaxId || employee?.panOrTaxId || 'ABCDE1234F';
  const uan = slip.uan || '100928374612';
  const workLocation = slip.workLocation || employee?.workLocation || 'Indore Plant';

  // Helper for grid cell
  const drawField = (label: string, value: string, colIndex: number, textY: number) => {
    const x = margin + colIndex * colWidth + paddingX;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(label.toUpperCase(), x, textY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    const cleanVal = (value || '—').length > 24 ? value.slice(0, 22) + '...' : (value || '—');
    doc.text(cleanVal, x, textY + 3.8);
  };

  // Row 1
  drawField('Employee Name', empName, 0, row1Y);
  drawField('Employee Code', empCode, 1, row1Y);
  drawField('Designation', desigTitle, 2, row1Y);
  drawField('Department', deptName, 3, row1Y);

  // Row 2
  drawField('Date of Joining', joiningDate, 0, row2Y);
  drawField('Bank Name', bankName, 1, row2Y);
  drawField('Bank Account No', bankAccount, 2, row2Y);
  drawField('Payment Mode', slip.paymentMode || 'Direct Bank Transfer (NEFT)', 3, row2Y);

  // Row 3
  drawField('PAN Number', pan, 0, row3Y);
  drawField('UAN Number', uan, 1, row3Y);
  drawField('Work Location', workLocation, 2, row3Y);
  drawField('Pay Period Cycle', '1st to End of Month', 3, row3Y);

  y += gridHeight + 4;

  // -------------------------------------------------------------
  // 3. ATTENDANCE & LEAVE SUMMARY STRIP (KEKA ATTENDANCE METRICS)
  // -------------------------------------------------------------
  const [yN, mN] = (slip.month || '2026-10').split('-').map(Number);
  const totalDays = slip.totalCalendarDays || new Date(yN, mN, 0).getDate();
  const payableDays = slip.payableDays !== undefined ? slip.payableDays : totalDays;
  const lopDays = slip.lopDays !== undefined ? slip.lopDays : Math.max(0, Number((totalDays - payableDays).toFixed(1)));

  const attStripHeight = 13;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, attStripHeight, 2, 2, 'FD');

  const attColWidth = contentWidth / 4;
  const drawAttMetric = (label: string, val: string | number, colIndex: number, isHighlight: boolean = false) => {
    const x = margin + colIndex * attColWidth + attColWidth / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(label.toUpperCase(), x, y + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    if (isHighlight) {
      doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    } else {
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    }
    doc.text(String(val), x, y + 10, { align: 'center' });
  };

  drawAttMetric('Calendar Days', totalDays, 0);
  drawAttMetric('Payable Days', payableDays, 1, true);
  drawAttMetric('Loss of Pay (LOP)', lopDays, 2);
  drawAttMetric('Working Days Policy', 'Mon - Sat (6/7 Work Days)', 3);

  y += attStripHeight + 5;

  // -------------------------------------------------------------
  // 4. EARNINGS & DEDUCTIONS DUAL TABLE (KEKA STANDARD FORMAT)
  // -------------------------------------------------------------
  const tableWidth = contentWidth;
  const halfTable = tableWidth / 2;
  const headerHeight = 7.5;
  const rowHeight = 6.8;

  // Left header: EARNINGS
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin, y, halfTable, headerHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('EARNINGS', margin + 4, y + 5);
  doc.text('AMOUNT (INR)', margin + halfTable - 4, y + 5, { align: 'right' });

  // Right header: DEDUCTIONS
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin + halfTable, y, halfTable, headerHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DEDUCTIONS', margin + halfTable + 4, y + 5);
  doc.text('AMOUNT (INR)', margin + tableWidth - 4, y + 5, { align: 'right' });

  y += headerHeight;

  // Earnings Rows
  const earningsItems = [
    { name: 'Basic Salary', amount: slip.basicPay },
    { name: 'House Rent Allowance (HRA)', amount: slip.hra },
    { name: 'Special Allowance', amount: slip.specialAllowance }
  ];

  // Deductions Rows
  const deductionsItems = [
    { name: 'Provident Fund (PF)', amount: slip.providentFund },
    { name: 'Professional Tax (PT)', amount: slip.professionalTax },
    { name: 'Employee State Insurance (ESI)', amount: slip.esi },
    { name: 'Income Tax / TDS', amount: slip.taxDeduction }
  ];

  const maxRows = Math.max(earningsItems.length, deductionsItems.length);

  for (let i = 0; i < maxRows; i++) {
    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, y, tableWidth, rowHeight, 'F');

    // Horizontal bottom line
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);

    // Left Earnings
    const earn = earningsItems[i];
    if (earn) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.text(earn.name, margin + 4, y + 4.6);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text(earn.amount.toLocaleString('en-IN'), margin + halfTable - 4, y + 4.6, { align: 'right' });
    }

    // Right Deductions
    const ded = deductionsItems[i];
    if (ded) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.text(ded.name, margin + halfTable + 4, y + 4.6);

      doc.setFont('helvetica', 'bold');
      if (ded.amount > 0) {
        doc.setTextColor(rose[0], rose[1], rose[2]);
      } else {
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      }
      doc.text(ded.amount.toLocaleString('en-IN'), margin + tableWidth - 4, y + 4.6, { align: 'right' });
    }

    y += rowHeight;
  }

  // Vertical split line
  const totalTableContentHeight = headerHeight + maxRows * rowHeight;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.line(margin + halfTable, y - maxRows * rowHeight, margin + halfTable, y);
  // Outer table box
  doc.rect(margin, y - totalTableContentHeight, tableWidth, totalTableContentHeight, 'D');

  // Total Earnings & Total Deductions Summary Row
  const totalRowHeight = 8;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.rect(margin, y, tableWidth, totalRowHeight, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(margin, y, tableWidth, totalRowHeight, 'D');
  doc.line(margin + halfTable, y, margin + halfTable, y + totalRowHeight);

  // Left Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('TOTAL GROSS EARNINGS', margin + 4, y + 5.2);
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text(`INR ${slip.grossSalary.toLocaleString('en-IN')}`, margin + halfTable - 4, y + 5.2, { align: 'right' });

  // Right Total
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('TOTAL DEDUCTIONS', margin + halfTable + 4, y + 5.2);
  doc.setTextColor(rose[0], rose[1], rose[2]);
  doc.text(`INR ${slip.totalDeductions.toLocaleString('en-IN')}`, margin + tableWidth - 4, y + 5.2, { align: 'right' });

  y += totalRowHeight + 5;

  // -------------------------------------------------------------
  // 5. NET SALARY TAKE-HOME HIGHLIGHT BANNER
  // -------------------------------------------------------------
  const netBoxHeight = 22;
  doc.setFillColor(emeraldBg[0], emeraldBg[1], emeraldBg[2]);
  doc.setDrawColor(emeraldBorder[0], emeraldBorder[1], emeraldBorder[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, y, contentWidth, netBoxHeight, 2, 2, 'FD');

  // Left: Net Pay & In Words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text('NET SALARY TAKE-HOME PAY', margin + 5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text(`INR ${slip.netPay.toLocaleString('en-IN')}`, margin + 5, y + 13.5);

  const words = numberToWordsIndian(slip.netPay);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(words, margin + 5, y + 18.5);

  // Right: Payment Status Badge
  const isPaid = slip.paymentStatus === 'PAID';
  const statusBadgeWidth = 55;
  const statusBadgeX = pageWidth - margin - statusBadgeWidth - 5;
  const statusBadgeY = y + 4.5;

  if (isPaid) {
    doc.setFillColor(emerald[0], emerald[1], emerald[2]);
    doc.roundedRect(statusBadgeX, statusBadgeY, statusBadgeWidth, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('PAID & CREDITED', statusBadgeX + statusBadgeWidth / 2, statusBadgeY + 4.8, { align: 'center' });

    if (slip.paymentReference) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.text(`Ref: ${slip.paymentReference}`, statusBadgeX + statusBadgeWidth / 2, statusBadgeY + 11.5, { align: 'center' });
    }
  } else {
    doc.setFillColor(245, 158, 11); // Amber
    doc.roundedRect(statusBadgeX, statusBadgeY, statusBadgeWidth, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('PENDING CONFIRMATION', statusBadgeX + statusBadgeWidth / 2, statusBadgeY + 4.8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text('Awaiting Finance Clearance', statusBadgeX + statusBadgeWidth / 2, statusBadgeY + 11.5, { align: 'center' });
  }

  y += netBoxHeight + 8;

  // -------------------------------------------------------------
  // 6. BOTTOM SIGNATURE & VERIFICATION SECTION
  // -------------------------------------------------------------
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Left Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('• This is an electronically generated salary slip and requires no physical signature.', margin, y);
  y += 3.8;
  doc.text(`• Generated on ${slip.generatedDate || new Date().toISOString().split('T')[0]} via Goodwin Grow HRMS Payroll Engine.`, margin, y);
  y += 3.8;
  doc.text('• Confidential document strictly intended for the designated employee.', margin, y);

  // Right Signatory Block
  const sigX = pageWidth - margin - 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text(`For ${companyName}`, sigX, y - 7.6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Authorized Signatory', sigX, y);

  // Save the PDF
  const cleanEmpCode = (slip.employeeCode || 'EMP').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanMonth = (slip.month || '2026-10').replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`Payslip_${cleanEmpCode}_${cleanMonth}.pdf`);
}
