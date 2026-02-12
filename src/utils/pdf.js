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
            // A5 Landscape: 595.28 x 419.53 points
            // margin: 0 is CRITICAL to prevent auto-adding new pages when drawing near edges
            const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: 0 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- Constants ---
            const pageWidth = 595.28;
            const pageHeight = 419.53;
            const margin = 20;
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
            doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryColor).text('ENERGY SPORTS', margin, headerY);

            // 2. Right Section Calculation
            // QR Code Box: far right
            const qrSize = 50;
            const qrX = pageWidth - margin - qrSize;
            const qrY = margin - 5;

            // Vertical Divider Line
            const dividerX = qrX - 15; // 15pt gap
            const dividerTop = margin - 5;
            const dividerBottom = margin + 45;

            // Text Area (Ends before divider)
            const textAreaWidth = dividerX - margin - 15; // 15pt gap before divider

            // Draw QR
            doc.image(qrCodeDataUrl, qrX, qrY, { fit: [qrSize, qrSize] });

            // Draw Vertical Divider
            doc.moveTo(dividerX, dividerTop).lineTo(dividerX, dividerBottom).strokeColor(borderColor).stroke();

            // Draw Header Text (Aligned Right within text area)
            doc.fontSize(12).fillColor('secondaryColor').font('Helvetica-Bold').text('REGISTRATION TICKET', margin, margin, {
                align: 'right',
                width: textAreaWidth
            });

            const regIdText = `ID: ${registration.registration_code.split('/').pop()}`;
            doc.fontSize(8).font('Helvetica').text(regIdText, margin, margin + 18, {
                align: 'right',
                width: textAreaWidth
            });

            // Horizontal Line below Header (Full width)
            const headerLineY = margin + 50;
            doc.moveTo(margin, headerLineY).lineTo(pageWidth - margin, headerLineY).strokeColor(borderColor).stroke();

            // ================= BODY =================

            // --- Warning ---
            doc.fontSize(6).fillColor('#6c757d').text('This e-ticket is valid only with an original College ID or Government-issued photo ID. Participants without valid identification will not be permitted to enter the venue.', margin, headerLineY + 5, { align: 'center', width: contentWidth });

            // --- Event Details Table ---
            let currentY = headerLineY + 20;
            doc.fontSize(10).fillColor('black').font('Helvetica-Bold').text('Event Details', margin, currentY);
            currentY += 12;

            const rowHeight = 14;
            const col1X = margin + 5;
            const col2X = margin + 90;
            const col3X = margin + 260;
            const col4X = margin + 350;

            const drawRow = (label1, val1, label2, val2, isHeader = false) => {
                if (isHeader) {
                    doc.rect(margin, currentY, contentWidth, rowHeight).fill(tableHeaderColor);
                    doc.fillColor('black');
                }
                const textY = currentY + 3.5; // Centered
                doc.fontSize(7).font('Helvetica-Bold').fillColor('black').text(label1, col1X, textY);
                doc.font('Helvetica').text(val1, col2X, textY, { width: 170, lineBreak: false, ellipsis: true });

                if (label2) {
                    doc.font('Helvetica-Bold').text(label2, col3X, textY);
                    doc.font('Helvetica').text(val2, col4X, textY);
                }
                doc.rect(margin, currentY, contentWidth, rowHeight).strokeColor(borderColor).stroke();
                currentY += rowHeight;
            };

            const paidDate = registration.Payment && registration.Payment.verified_at ? new Date(registration.Payment.verified_at).toLocaleDateString() : 'Verify Pending';
            const amount = registration.Payment ? `Rs. ${registration.Payment.amount}` : 'N/A';
            const eventDate = 'Feb 2026';

            // Rows
            const sportSummary = registration.Sports.map(s => `${s.name} (${s.category})`).join(', ');
            drawRow(`Ref: ${registration.registration_code}`, '', `Booked: ${new Date(registration.created_at).toLocaleDateString()}`, '', true);
            drawRow('Transaction ID', registration.Payment?.txn_id || '-', 'Payment Status', registration.payment_status.toUpperCase());
            drawRow('Sports', sportSummary, 'Event Date', eventDate);
            drawRow('College', registration.College ? registration.College.name : 'Other', 'Accommodation', registration.accommodation_needed ? 'Yes' : 'No');
            drawRow('Total Fare', amount, 'Verified Date', paidDate);

            // --- Participant Details ---
            currentY += 10;
            doc.fontSize(10).font('Helvetica-Bold').text('Registration Details', margin, currentY);
            currentY += 12;

            // Table Header
            doc.rect(margin, currentY, contentWidth, 12).fill(grayColor);
            doc.fillColor('black').fontSize(7);
            const pHeadY = currentY + 2.5; // Centered
            doc.text('S.No', margin + 5, pHeadY);
            doc.text('Game Name', margin + 30, pHeadY);
            doc.text('Category', margin + 180, pHeadY);
            doc.text('Amount', margin + 250, pHeadY);
            doc.text('Status', margin + 400, pHeadY);

            doc.rect(margin, currentY, contentWidth, 12).stroke();
            currentY += 12;

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
            const footerYStart = Math.min(currentY + 20, pageHeight - 110);

            // 1. Fare & Instructions
            doc.fontSize(9).font('Helvetica-Bold').text('Total Amount:', margin + 300, footerYStart);
            doc.text(amount, margin + 380, footerYStart, { align: 'right', width: 80 });

            doc.fontSize(8).font('Helvetica-Bold').text('Instructions:', margin, footerYStart);
            doc.fontSize(6).font('Helvetica').list([
                'Carry College ID + Aadhar Xerox + Bonafide Cert.',
                'Plus THIS Entry Ticket.',
                'Report 30 mins prior to event.',
            ], margin, footerYStart + 12, { bulletRadius: 1, width: 300, lineGap: 1 });

            // 2. Bottom Divider Line
            const bottomLineY = pageHeight - 25;
            doc.moveTo(margin, bottomLineY).lineTo(pageWidth - margin, bottomLineY).strokeColor(borderColor).stroke();

            // 3. Bottom Text Split
            // Left
            doc.fontSize(7).fillColor('black').text('Energy Sports Meet 2026 | For Any Help or Query contact Registration Desk', margin, bottomLineY + 6, { width: 320, align: 'left', lineBreak: false });

            // Right (Calculated X to ensure fit)
            doc.text('energy.egspgroup.in | @egspec', pageWidth - margin - 200, bottomLineY + 6, { width: 200, align: 'right', lineBreak: false });

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
            const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: 0 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Colors
            const headerBg = '#1a1a1a';
            const headerText = '#ffffff';
            const accentColor = '#0056b3';
            const lightBg = '#f4f4f4';

            const pageWidth = 595.28;
            const pageHeight = 419.53;
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);

            // --- Header Bar ---
            doc.rect(0, 0, pageWidth, 50).fill(headerBg);
            doc.fontSize(18).font('Helvetica-Bold').fillColor(headerText).text('OFFICIAL CHECK-IN PASS', 0, 15, { align: 'center' });
            doc.fontSize(8).font('Helvetica').text('ENERGY SPORTS MEET 2026', 0, 35, { align: 'center' });

            // --- Main Layout ---
            const leftColX = margin;
            const leftColWidth = (contentWidth * 0.7) - 10;
            const rightColX = margin + leftColWidth + 20;
            const rightColWidth = (contentWidth * 0.3) - 10;

            let currentY = 70;

            // --- Participant Name & Code ---
            doc.fillColor('black');
            doc.fontSize(22).font('Helvetica-Bold').text(registration.Student.name, leftColX, currentY);
            currentY += 25;
            doc.fontSize(12).font('Helvetica').fillColor('#555').text(registration.registration_code, leftColX, currentY);

            // --- QR Code (Right Side) ---
            const baseUrl = process.env.BASE_URL || 'energy.egspgroup.in';
            const qrData = `${baseUrl}/energy/2026/checkin?id=${registration.registration_code}`;
            const qrCodeDataUrl = await QRCode.toDataURL(qrData);
            doc.image(qrCodeDataUrl, rightColX, 60, { fit: [90, 90] });

            // --- Reporting Time Box ---
            // Let's put reporting time prominent
            doc.rect(rightColX, 160, rightColWidth, 40).fill(lightBg);
            doc.fillColor('black').fontSize(8).font('Helvetica-Bold').text('REPORTING TIME', rightColX, 165, { align: 'center', width: rightColWidth });
            doc.fontSize(14).fillColor(accentColor).text('08:30 AM', rightColX, 180, { align: 'center', width: rightColWidth });

            // --- Detailed Info Table (Left Col) ---
            currentY = 110;
            const rowHeight = 20;

            const field = (label, value, y) => {
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text(label, leftColX, y);
                doc.font('Helvetica').fillColor('black').text(value, leftColX + 80, y, { width: leftColWidth - 80 });
                doc.moveTo(leftColX, y + 15).lineTo(leftColX + leftColWidth, y + 15).strokeColor('#eee').stroke();
            };

            const sportSummary = registration.Sports.map(s => `${s.name} (${s.category})`).join(', ');
            field('Sports:', sportSummary, currentY);
            currentY += rowHeight;
            field('College:', registration.College?.name || 'Other', currentY);
            currentY += rowHeight;
            field('Status:', registration.status.toUpperCase(), currentY);
            currentY += rowHeight;
            field('Payment:', registration.payment_status.toUpperCase(), currentY);

            // --- Barcode (Bottom Full Width) ---
            const barcodeY = pageHeight - 90;
            try {
                const barcodeBuffer = await bwipjs.toBuffer({
                    bcid: 'code128',
                    text: registration.registration_code,
                    scale: 2,
                    height: 10,
                    includetext: true,
                    textxalign: 'center'
                });
                doc.image(barcodeBuffer, (pageWidth - 200) / 2, barcodeY, { width: 200, height: 40 });
            } catch (err) { }

            // --- Footer ---
            const footerY = pageHeight - 30;
            doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor('#ccc').stroke();
            doc.fontSize(7).fillColor('#777').text('Electronically Verified. Please present at the registration desk.', margin, footerY + 10, { align: 'center', width: contentWidth });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
