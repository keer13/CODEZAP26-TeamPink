import { jsPDF } from 'jspdf';
import { Medication, AdherenceRecord, HealthLog, UserProfile } from '../types';

export const generatePatientReport = (
  medications: Medication[],
  adherence: AdherenceRecord[],
  healthLogs: HealthLog[],
  profile: UserProfile | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let y = margin;

  // Helper to check for page overflow
  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawPageHeaderFooter();
    }
  };

  // Helper to draw clean section dividers
  const drawSectionDivider = () => {
    checkPageOverflow(8);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  // Page Header & Footer (for subsequent pages)
  const drawPageHeaderFooter = () => {
    // Top border/header line
    doc.setDrawColor(30, 58, 138); // deep blue primary
    doc.setLineWidth(1);
    doc.line(margin, 12, pageWidth - margin, 12);

    // Mini header text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Healthcare AI - Clinical Patient Report`, margin, 9);
    doc.text(`Patient: ${profile?.name || 'N/A'}`, pageWidth - margin, 9, { align: 'right' });

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    doc.text(
      'CONFIDENTIAL - This report contains protected personal health information.',
      margin,
      pageHeight - 10
    );
    doc.text(
      `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  };

  // 1. REPORT TITLE & METADATA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // Primary Clinical Blue
  doc.text('CLINICAL PATIENT REPORT', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const currentDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.text(`Generated on: ${currentDate}`, margin, y);
  doc.text('Engine Version: v2.4 (HIPAA-Compliant)', pageWidth - margin, y, { align: 'right' });
  y += 10;

  // 2. PATIENT INFO BLOCK (FANCY CARD)
  checkPageOverflow(55);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 42, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('PATIENT PROFILE', margin + 5, y + 6);

  // Divider inside the card
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 5, y + 9, pageWidth - margin - 5, y + 9);

  // Patient Details Grid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  // Column 1
  doc.text(`Name:`, margin + 5, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${profile?.name || 'Unspecified'}`, margin + 30, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Age:`, margin + 5, y + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${profile?.age || 'Unspecified'} yrs`, margin + 30, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Blood Type:`, margin + 5, y + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${profile?.bloodType || 'Unspecified'}`, margin + 30, y + 27);

  // Column 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Chronic Conditions:`, margin + 85, y + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const conditionsText = profile?.chronicConditions && profile.chronicConditions.length > 0
    ? profile.chronicConditions.join(', ')
    : 'None declared';
  doc.text(conditionsText, margin + 120, y + 15, { maxWidth: 60 });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Allergies:`, margin + 85, y + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const allergiesText = profile?.allergies && profile.allergies.length > 0
    ? profile.allergies.join(', ')
    : 'None declared';
  doc.text(allergiesText, margin + 120, y + 27, { maxWidth: 60 });

  // Special Clinical Parameters (Pregnancy / Organ Impairment)
  const riskLabels: string[] = [];
  if (profile?.isPregnancy) riskLabels.push('Pregnant');
  if (profile?.kidneyImpairment) riskLabels.push('Kidney Impairment');
  if (profile?.liverImpairment) riskLabels.push('Liver Impairment');

  if (riskLabels.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Risk Factors:`, margin + 85, y + 36);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68); // Red
    doc.text(riskLabels.join(', '), margin + 120, y + 36);
  }

  y += 48;

  // 3. MEDICATIONS SECTION
  checkPageOverflow(15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138); // Deep Blue
  doc.text('ACTIVE MEDICATION REGIMEN', margin, y);
  y += 6;

  if (medications.length === 0) {
    checkPageOverflow(15);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No active medications currently registered in the profile.', margin, y);
    y += 10;
  } else {
    // Header for Medications list
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Medication Name', margin + 4, y + 5.5);
    doc.text('Dosage', margin + 60, y + 5.5);
    doc.text('Frequency', margin + 95, y + 5.5);
    doc.text('Supply Status', margin + 140, y + 5.5);
    y += 10;

    medications.forEach((med) => {
      // Approximate height of this med row: 14mm
      checkPageOverflow(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(med.name, margin + 4, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(med.dosage, margin + 60, y + 4);
      doc.text(med.frequency, margin + 95, y + 4);

      // Supply bar/warning
      const lowStock = med.remaining <= (med.lowStockThreshold || 5);
      if (lowStock) {
        doc.setTextColor(239, 68, 68); // critical red
        doc.setFont('helvetica', 'bold');
        doc.text(`LOW STOCK (${med.remaining}/${med.total})`, margin + 140, y + 4);
      } else {
        doc.setTextColor(34, 197, 94); // safe green
        doc.text(`OK (${med.remaining}/${med.total})`, margin + 140, y + 4);
      }

      // Instructions below if exists
      if (med.instructions) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Instructions: ${med.instructions}`, margin + 4, y + 9, { maxWidth: pageWidth - 2 * margin - 8 });
      }

      // Underline medication row
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 11, pageWidth - margin, y + 11);

      y += 13;
    });
    y += 4;
  }

  drawSectionDivider();

  // 4. WEEKLY ADHERENCE PROFILE
  checkPageOverflow(15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138);
  doc.text('7-DAY ADHERENCE RECORD', margin, y);
  y += 6;

  // Let's filter adherence for the last 7 days to report
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  // Draw adherence summary table
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Date', margin + 4, y + 5.5);
  doc.text('Scheduled Doses', margin + 50, y + 5.5);
  doc.text('Taken Doses', margin + 95, y + 5.5);
  doc.text('Adherence Rate', margin + 140, y + 5.5);
  y += 10;

  let totalScheduled = 0;
  let totalTaken = 0;

  last7Days.forEach((date) => {
    checkPageOverflow(10);
    const dayRecords = adherence.filter((a) => a.date === date);
    const takenCount = dayRecords.filter((a) => a.taken).length;
    
    // We assume medications.length is total expected doses if there are no specific logs
    const expectedCount = medications.length || 1;
    const rate = Math.min(Math.round((takenCount / expectedCount) * 100), 100);

    totalScheduled += expectedCount;
    totalTaken += takenCount;

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(formattedDate, margin + 4, y + 4);
    doc.text(`${expectedCount}`, margin + 50, y + 4);
    doc.text(`${takenCount}`, margin + 95, y + 4);

    // Color rate based on adherence levels
    if (rate >= 90) {
      doc.setTextColor(34, 197, 94); // Green
    } else if (rate >= 70) {
      doc.setTextColor(245, 158, 11); // Amber
    } else {
      doc.setTextColor(239, 68, 68); // Red
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`${rate}%`, margin + 140, y + 4);

    // Row divider
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 7, pageWidth - margin, y + 7);
    y += 9;
  });

  // Print Overall average Adherence rate
  checkPageOverflow(15);
  const overallRate = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y + 2, pageWidth - 2 * margin, 12, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text(`Overall 7-Day Patient Adherence Average: ${overallRate}%`, margin + 6, y + 9.5);
  y += 18;

  drawSectionDivider();

  // 5. VITALS & BIOMETRIC LOGS
  checkPageOverflow(15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138);
  doc.text('RECENT CLINICAL VITAL LOGS', margin, y);
  y += 6;

  if (healthLogs.length === 0) {
    checkPageOverflow(15);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No vital logs registered in this profile.', margin, y);
    y += 10;
  } else {
    // Sort health logs newest first, limit to 8 entries for presentation
    const recentLogs = [...healthLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Date', margin + 4, y + 5.5);
    doc.text('Measurement Type', margin + 50, y + 5.5);
    doc.text('Value Recorded', margin + 110, y + 5.5);
    doc.text('Reference Status', margin + 150, y + 5.5);
    y += 10;

    recentLogs.forEach((log) => {
      checkPageOverflow(10);

      const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const label = log.type
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(formattedDate, margin + 4, y + 4);
      doc.text(label, margin + 50, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.text(`${log.value} ${log.unit}`, margin + 110, y + 4);

      // Simple normal/abnormal check logic for visual aid
      let reference = 'Normal';
      let refColor: [number, number, number] = [34, 197, 94]; // Green

      if (log.type === 'blood_pressure') {
        const sys = parseInt(log.value.split('/')[0]) || 120;
        const dia = parseInt(log.value.split('/')[1]) || 80;
        if (sys >= 140 || dia >= 90) {
          reference = 'Hypertensive Stage 2';
          refColor = [239, 68, 68]; // Red
        } else if (sys >= 130 || dia >= 80) {
          reference = 'Hypertensive Stage 1';
          refColor = [245, 158, 11]; // Amber
        } else if (sys >= 120) {
          reference = 'Elevated';
          refColor = [59, 130, 246]; // Blue
        }
      } else if (log.type === 'glucose') {
        const gl = parseFloat(log.value);
        if (!isNaN(gl)) {
          if (gl >= 126) {
            reference = 'High (Fasting)';
            refColor = [239, 68, 68];
          } else if (gl >= 100) {
            reference = 'Pre-diabetic Range';
            refColor = [245, 158, 11];
          }
        }
      }

      doc.setTextColor(...refColor);
      doc.text(reference, margin + 150, y + 4);

      // Row divider
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 7, pageWidth - margin, y + 7);
      y += 9;
    });
  }

  // Draw Header/Footer for the first page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageHeaderFooter();
  }

  // Trigger Save File
  const filename = `Healthcare_Report_${profile?.name?.replace(/\s+/g, '_') || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
