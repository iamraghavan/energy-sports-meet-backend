const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

/**
 * Generate Registration Confirmation PDF (Train Ticket Style)
 * Changes: 
 * 1. FIXED 3-Page Issue by setting margin:0 and managing manually.
 * 2. FIXED Header Overlap with Vertical Divider.
 * Layout: A5 Landscape strictly single page (595.28 x 419.53)
 * @param {Object} registration 
 * @returns {Promise<Buffer>}
 */
exports.generateRegistrationPDF = async (registration) => {
    return new Promise(async (resolve, reject) => {
        try {
            // A4 Portrait Size: 595.28 x 841.89 points
            // Restricting content to top half (~420 points)
            const doc = new PDFDocument({ size: 'A4', margin: 0 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- Constants ---
            const pageWidth = 595.28;
            const pageHeight = 841.89; // Full A4 height
            const halfPageHeight = 420.94; // Half A4
            const margin = 30;
            const contentWidth = pageWidth - (margin * 2);

            // --- Colors ---
            const primaryColor = '#0056b3';
            const grayColor = '#f8f9fa';
            const borderColor = '#dee2e6';
            const tableHeaderColor = '#e9ecef';

            // --- QR Code ---
            const baseUrl = process.env.BASE_URL || 'energy.egspgroup.in';
            const qrData = `${baseUrl}/energy/2026/registration/details?id=${registration.registration_code}&public=yes`;
            const qrCodeDataUrl = await QRCode.toDataURL(qrData);

            // ================= HEADER =================
            const headerY = margin;

            // 1. Logo (Left)
            doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('ENERGY SPORTS', margin, headerY);

            // 2. Right Section Calculation
            const qrSize = 55;
            const qrX = pageWidth - margin - qrSize;
            const qrY = margin - 5;

            // Vertical Divider Line
            const dividerX = qrX - 20;
            const dividerTop = margin - 5;
            const dividerBottom = margin + 50;

            // Text Area
            const textAreaWidth = dividerX - margin - 20;

            // Draw QR
            doc.image(qrCodeDataUrl, qrX, qrY, { fit: [qrSize, qrSize] });

            // Draw Vertical Divider
            doc.moveTo(dividerX, dividerTop).lineTo(dividerX, dividerBottom).strokeColor(borderColor).stroke();

            // Draw Header Text
            doc.fontSize(14).fillColor('black').font('Helvetica-Bold').text('REGISTRATION TICKET', margin, margin, {
                align: 'right',
                width: textAreaWidth
            });

            const regIdText = `ID: ${registration.registration_code.split('/').pop()}`;
            doc.fontSize(9).font('Helvetica').text(regIdText, margin, margin + 20, {
                align: 'right',
                width: textAreaWidth
            });

            // Horizontal Line below Header
            const headerLineY = margin + 60;
            doc.moveTo(margin, headerLineY).lineTo(pageWidth - margin, headerLineY).strokeColor(borderColor).stroke();

            // ================= BODY =================

            // --- Warning ---
            doc.fontSize(7).fillColor('#6c757d').text('This e-ticket is valid only with an original College ID. Participants without valid ID will not be permitted.', margin, headerLineY + 8, { align: 'center', width: contentWidth });

            // --- Event Details Table ---
            let currentY = headerLineY + 30;
            doc.fontSize(12).fillColor('black').font('Helvetica-Bold').text('Event Details', margin, currentY);
            currentY += 15;

            const col1X = margin + 5;
            const col2X = margin + 100;
            const col3X = margin + 280;
            const col4X = margin + 380;

            /**
             * Enhanced Row Drawer with Text Wrapping Support
             */
            const drawRow = (label1, val1, label2, val2, isHeader = false, allowWrap = false) => {
                const labelFont = 8;
                const valueFont = 8;

                // Calculate height based on wrapped text if allowed
                const valWidth = allowWrap ? 170 : 170;
                const h1 = allowWrap ? doc.heightOfString(val1, { width: valWidth, size: valueFont }) + 6 : 16;
                const h2 = (label2 && allowWrap) ? doc.heightOfString(val2, { width: 140, size: valueFont }) + 6 : 16;
                const dynamicRowHeight = Math.max(h1, h2, 16);

                if (isHeader) {
                    doc.rect(margin, currentY, contentWidth, dynamicRowHeight).fill(tableHeaderColor);
                    doc.fillColor('black');
                }

                const textY = currentY + (dynamicRowHeight / 2) - (labelFont / 2);

                doc.fontSize(labelFont).font('Helvetica-Bold').fillColor('black').text(label1, col1X, textY);

                if (allowWrap) {
                    doc.fontSize(valueFont).font('Helvetica').text(val1, col2X, textY, { width: valWidth });
                } else {
                    doc.fontSize(valueFont).font('Helvetica').text(val1, col2X, textY, { width: valWidth, lineBreak: false, ellipsis: true });
                }

                if (label2) {
                    doc.font('Helvetica-Bold').text(label2, col3X, textY);
                    doc.font('Helvetica').text(val2, col4X, textY);
                }

                doc.rect(margin, currentY, contentWidth, dynamicRowHeight).strokeColor(borderColor).stroke();
                currentY += dynamicRowHeight;
            };

            const paidDate = registration.Payment && registration.Payment.verified_at ? new Date(registration.Payment.verified_at).toLocaleDateString() : 'Pending';
            const amount = registration.Payment ? `Rs. ${registration.Payment.amount}` : 'N/A';
            const eventDate = 'Feb 2026';

            // Rows
            const sportSummary = registration.Sports.map(s => `${s.name} (${s.category})`).join(', ');
            drawRow(`Ref: ${registration.registration_code}`, '', `Booked: ${new Date(registration.created_at).toLocaleDateString()}`, '', true);
            drawRow('Transaction ID', registration.Payment?.txn_id || '-', 'Payment Status', registration.payment_status.toUpperCase());

            // Sports Row - ENABLE WRAPPING
            drawRow('Sports registered', sportSummary, 'Event Date', eventDate, false, true);

            drawRow('College', registration.college_name || 'Other', 'Accommodation', registration.accommodation_needed ? 'Yes' : 'No');
            drawRow('Total Fare', amount, 'Verified Date', paidDate);

            // --- Participant Details ---
            currentY += 15;
            doc.fontSize(12).font('Helvetica-Bold').text('Registration Details', margin, currentY);
            currentY += 15;

            // Table Header
            doc.rect(margin, currentY, contentWidth, 14).fill(grayColor);
            doc.fillColor('black').fontSize(8);
            const pHeadY = currentY + 3.5;
            doc.text('S.No', margin + 5, pHeadY);
            doc.text('Game Name', margin + 35, pHeadY);
            doc.text('Category', margin + 180, pHeadY);
            doc.text('Amount', margin + 280, pHeadY);
            doc.text('Status', margin + 400, pHeadY);

            doc.rect(margin, currentY, contentWidth, 14).stroke();
            currentY += 14;

            // Table Rows for each sport
            doc.font('Helvetica');
            registration.Sports.forEach((sport, index) => {
                const sRowY = currentY + 3.5;
                doc.text(index + 1, margin + 5, sRowY);
                doc.text(sport.name, margin + 30, sRowY);
                doc.text(sport.category, margin + 180, sRowY);
                doc.text(`Rs. ${sport.amount}`, margin + 250, sRowY);
                doc.text(registration.status.toUpperCase(), margin + 400, sRowY);

                doc.rect(margin, currentY, contentWidth, 14).stroke();
                currentY += 14;
            });

            // ================= FOOTER =================
            // Reduct space: Use currentY if it hasn't reached the safety zone
            const footerYStart = currentY + 25;

            // 1. Fare & Instructions
            doc.fontSize(10).font('Helvetica-Bold').text('Total Amount Paid:', margin + 280, footerYStart);
            doc.fontSize(12).fillColor(primaryColor).text(amount, margin + 400, footerYStart - 2, { align: 'right', width: 80 });

            doc.fillColor('black').fontSize(9).font('Helvetica-Bold').text('Reporting Instructions:', margin, footerYStart);
            doc.fontSize(7).font('Helvetica').list([
                'Carry Original College ID Card + Photocopy of Aadhar.',
                'Present THIS Entry Ticket (Digital or Printed) at the entry gate.',
                'Report at the venue 45 minutes prior to your event start time.',
            ], margin, footerYStart + 15, { bulletRadius: 1.5, width: 320, lineGap: 3 });

            // 2. Bottom Divider Line (Restricted to Half Page)
            const bottomLineY = Math.max(footerYStart + 60, 400);
            doc.moveTo(margin, bottomLineY).lineTo(pageWidth - margin, bottomLineY).strokeColor(borderColor).stroke();

            // 3. Bottom Text Split
            doc.fontSize(7).fillColor('#666').text('Energy Sports Meet 2026 | Registration Desk: +91 9942502245', margin, bottomLineY + 8, { width: 320, align: 'left' });
            doc.text('Official Portal: energy.egspgroup.in | Branding Team', pageWidth - margin - 250, bottomLineY + 8, { width: 250, align: 'right' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Professional Check-In Pass
 * Changes: Explicit margin:0 to prevent overflow. Fixed layout.
 * Layout: A5 Landscape
 * @param {Object} registration 
 * @returns {Promise<Buffer>}
 */
exports.generateCheckInPDF = async (registration) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Colors
            const headerBg = '#1a1a1a';
            const headerText = '#ffffff';
            const accentColor = '#0056b3';
            const lightBg = '#f4f4f4';

            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const halfPageHeight = 420.94;
            const margin = 30;
            const contentWidth = pageWidth - (margin * 2);

            // --- Header Bar ---
            doc.rect(0, 0, pageWidth, 60).fill(headerBg);
            doc.fontSize(20).font('Helvetica-Bold').fillColor(headerText).text('OFFICIAL CHECK-IN PASS', 0, 18, { align: 'center' });
            doc.fontSize(9).font('Helvetica').text('ENERGY SPORTS MEET 2026', 0, 40, { align: 'center' });

            // --- Main Layout ---
            const leftColX = margin;
            const leftColWidth = (contentWidth * 0.65) - 10;
            const rightColX = margin + leftColWidth + 20;
            const rightColWidth = (contentWidth * 0.35) - 10;

            let currentY = 80;

            // --- Participant Name & Code ---
            doc.fillColor('black');
            doc.fontSize(24).font('Helvetica-Bold').text(registration.Student.name, leftColX, currentY);
            currentY += 28;
            doc.fontSize(14).font('Helvetica').fillColor('#555').text(registration.registration_code, leftColX, currentY);

            // --- QR Code (Right Side) ---
            const baseUrl = process.env.BASE_URL || 'energy.egspgroup.in';
            const qrData = `${baseUrl}/energy/2026/checkin?id=${registration.registration_code}`;
            const qrCodeDataUrl = await QRCode.toDataURL(qrData);
            doc.image(qrCodeDataUrl, rightColX, 75, { fit: [100, 100] });

            // --- Reporting Time Box ---
            doc.rect(rightColX, 185, rightColWidth, 50).fill(lightBg);
            doc.fillColor('black').fontSize(9).font('Helvetica-Bold').text('REPORTING TIME', rightColX, 195, { align: 'center', width: rightColWidth });
            doc.fontSize(16).fillColor(accentColor).text('08:30 AM', rightColX, 210, { align: 'center', width: rightColWidth });

            // --- Detailed Info Table (Left Col) ---
            currentY = 130;
            const rowHeight = 22;

            const field = (label, value, y, isLong = false) => {
                const labelWidth = 80;
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(label, leftColX, y);

                const valX = leftColX + labelWidth;
                const valWidth = leftColWidth - labelWidth;

                if (isLong) {
                    doc.font('Helvetica').fillColor('black').text(value, valX, y, { width: valWidth });
                } else {
                    doc.font('Helvetica').fillColor('black').text(value, valX, y, { width: valWidth, lineBreak: false, ellipsis: true });
                }

                const lineY = isLong ? y + doc.heightOfString(value, { width: valWidth }) + 5 : y + 18;
                doc.moveTo(leftColX, lineY).lineTo(leftColX + leftColWidth, lineY).strokeColor('#eee').stroke();
                return lineY - y + 10; // Return height used
            };

            const sportSummary = registration.Sports.map(s => `${s.name} (${s.category})`).join(', ');
            currentY += field('Sports:', sportSummary, currentY, true);
            currentY += field('College:', registration.college_name || 'Other', currentY);
            currentY += field('Status:', registration.status.toUpperCase(), currentY);
            currentY += field('Payment:', registration.payment_status.toUpperCase(), currentY);

            // --- Barcode (Bottom of Top Half) ---
            const barcodeY = halfPageHeight - 85;
            try {
                const barcodeBuffer = await bwipjs.toBuffer({
                    bcid: 'code128',
                    text: registration.registration_code,
                    scale: 2,
                    height: 12,
                    includetext: true,
                    textxalign: 'center'
                });
                doc.image(barcodeBuffer, (pageWidth - 220) / 2, barcodeY, { width: 220, height: 45 });
            } catch (err) { }

            // --- Footer ---
            const footerY = halfPageHeight - 30;
            doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor('#ccc').stroke();
            doc.fontSize(8).fillColor('#777').text('Electronically Verified Passenger. Present at Gate 4.', margin, footerY + 10, { align: 'center', width: contentWidth });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
