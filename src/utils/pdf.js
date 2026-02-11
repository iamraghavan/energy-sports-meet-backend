const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate Registration Confirmation PDF (Train Ticket Style)
 * Layout: A5 Landscape
 * @param {Object} registration 
 * @returns {Promise<Buffer>}
 */
exports.generateRegistrationPDF = async (registration) => {
    return new Promise(async (resolve, reject) => {
        try {
            // A5 Landscape: ~595 x 420 points
            const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: 30 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- Colors ---
            const primaryColor = '#0056b3'; // Blueish
            const grayColor = '#f8f9fa';
            const borderColor = '#dee2e6';
            const tableHeaderColor = '#e9ecef';

            const pageWidth = doc.page.width; // ~595
            const pageHeight = doc.page.height; // ~420
            const margin = 30;
            const contentWidth = pageWidth - (margin * 2);

            // --- QR Code Generation ---

            const baseUrl = process.env.BASE_URL || 'energy.egspgroup.in'; // Fallback
            const qrData = `${baseUrl}/energy/2026/registration/details?id=${registration.registration_code}&public=yes`;
            const qrCodeDataUrl = await QRCode.toDataURL(qrData);

            // --- Header ---
            // Logo (Text for now)
            doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('ENERGY SPORTS', margin, margin);

            // Header Right Side
            const headerRightX = pageWidth - margin;

            // "REGISTRATION"
            doc.fontSize(14).fillColor('black').text('REGISTRATION', 0, margin, { align: 'right', width: contentWidth });

            // Registration ID
            const regIdText = `Registration ID - ${registration.registration_code.split('/').pop()}`;
            doc.fontSize(9).font('Helvetica').text(regIdText, 0, margin + 20, { align: 'right', width: contentWidth - 55 }); // Leave space for QR

            // QR Code in Header (Rightmost)
            doc.image(qrCodeDataUrl, pageWidth - margin - 50, margin, { fit: [50, 50] });

            // Horizontal Line
            doc.moveTo(margin, margin + 55).lineTo(pageWidth - margin, margin + 55).strokeColor(borderColor).stroke();

            // --- Warning Text ---
            doc.moveDown(3.5); // Adjust based on QR height
            doc.fontSize(7).fillColor('#6c757d').text('This e-ticket will only be valid along with a College ID proof in original. If found without ID proof, entry may be denied.', { align: 'center' });
            doc.moveDown(1);

            // --- Registration Details Section ---
            doc.fontSize(11).fillColor('black').font('Helvetica-Bold').text('Journey Details (Event Info)', margin, doc.y);
            doc.moveDown(0.2);

            let rowHeight = 16;
            let col1X = margin + 5;
            let col2X = margin + 110;
            let col3X = margin + 280; // Adjust for landscape
            let col4X = margin + 380;

            // Helper to draw border row
            const drawRow = (label1, val1, label2, val2, isHeader = false) => {
                const y = doc.y;
                // Background
                if (isHeader) {
                    doc.rect(margin, y, contentWidth, rowHeight).fill(tableHeaderColor);
                    doc.fillColor('black');
                } else {
                    // Alternating could be added here, but simple border is fine
                }

                // Text
                const textY = y + 4;
                doc.fontSize(8).font('Helvetica-Bold').fillColor('black').text(label1, col1X, textY);
                doc.font('Helvetica').text(val1, col2X, textY);

                if (label2) {
                    doc.font('Helvetica-Bold').text(label2, col3X, textY);
                    doc.font('Helvetica').text(val2, col4X, textY);
                }

                // Borders
                doc.rect(margin, y, contentWidth, rowHeight).strokeColor(borderColor).stroke();

                // Vertical Dividers approx
                // doc.moveTo(col2X - 5, y).lineTo(col2X - 5, y + rowHeight).stroke();
                // doc.moveTo(col3X - 5, y).lineTo(col3X - 5, y + rowHeight).stroke();
                // doc.moveTo(col4X - 5, y).lineTo(col4X - 5, y + rowHeight).stroke();

                doc.y = y + rowHeight;
            };

            const paidDate = registration.Payment && registration.Payment.verified_at ? new Date(registration.Payment.verified_at).toLocaleDateString() : 'Pending';
            const amount = registration.Payment ? `Rs. ${registration.Payment.amount}` : 'N/A';
            const eventDate = 'February 2026'; // Static or from Sport

            // Table Header info
            doc.rect(margin, doc.y, contentWidth, rowHeight).fill(tableHeaderColor);
            doc.fillColor('black').fontSize(8).font('Helvetica-Bold').text(`Reference ID: ${registration.registration_code}`, margin + 5, doc.y + 4);
            doc.text(`Date of Booking: ${new Date(registration.created_at).toLocaleString()}`, margin, doc.y - 8, { align: 'right', width: contentWidth - 5 });
            doc.y += rowHeight;

            // Table Body
            drawRow('Transaction ID', registration.Payment?.txn_id || 'N/A', 'Payment Status', registration.payment_status.toUpperCase());
            drawRow('Sport', registration.Sport.name, 'Event Date', eventDate);
            drawRow('Category', registration.Sport.type, 'Accommodation', registration.accommodation_needed ? 'Yes' : 'No');
            drawRow('College', registration.Student.College ? registration.Student.College.name : 'Other', 'Department', registration.Student.department);
            drawRow('Total Fare', amount, 'Verified Date', paidDate);

            doc.moveDown(1);

            // --- Participant Details ---
            doc.fontSize(11).font('Helvetica-Bold').text('Participant Details', margin);
            doc.moveDown(0.2);

            // Table Header
            const tableTop = doc.y;
            doc.rect(margin, tableTop, contentWidth, 15).fill(grayColor);
            doc.fillColor('black').fontSize(8);

            doc.text('S.No', margin + 5, tableTop + 3.5);
            doc.text('Name', margin + 40, tableTop + 3.5);
            doc.text('Gender', margin + 200, tableTop + 3.5);
            doc.text('Reg Code', margin + 300, tableTop + 3.5);
            doc.text('Status', margin + 450, tableTop + 3.5);

            // Table Row
            const rowY = tableTop + 15;
            doc.font('Helvetica');
            doc.text('1', margin + 5, rowY + 3.5);
            doc.text(registration.Student.name, margin + 40, rowY + 3.5);
            doc.text(registration.Student.gender, margin + 200, rowY + 3.5);
            doc.text(registration.registration_code, margin + 300, rowY + 3.5);
            doc.text(registration.status.toUpperCase(), margin + 450, rowY + 3.5);

            doc.rect(margin, tableTop, contentWidth, 30).strokeColor(borderColor).stroke();
            doc.y = rowY + 20;

            doc.moveDown(1);

            // --- Fare Details (Bottom Right) ---
            const fareY = doc.y;
            doc.fontSize(9).font('Helvetica-Bold').text('Total Amount:', margin + 300, fareY);
            doc.text(amount, margin + 400, fareY, { align: 'right', width: 100 });

            doc.moveDown(2);

            // --- Footer / Instructions ---
            // Keep it small to fit A5
            doc.fontSize(10).font('Helvetica-Bold').text('Important Instructions', margin);
            doc.fontSize(7).font('Helvetica').list([
                'Participants must carry this e-ticket along with valid College ID.',
                'Report to the registration desk 30 minutes before the event.'
            ], { bulletRadius: 1 });

            doc.moveDown(1);
            doc.moveTo(margin, doc.page.height - 40).lineTo(pageWidth - margin, doc.page.height - 40).stroke();

            doc.text('NOTE: This is computer generated receipt and does not require physical signature.', margin, doc.page.height - 30, { align: 'center', width: contentWidth });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate Simple Check-In PDF
 * Layout: A5 Landscape
 * @param {Object} registration 
 * @returns {Promise<Buffer>}
 */
exports.generateCheckInPDF = async (registration) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: 30 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const pageWidth = doc.page.width;
            const margin = 30;

            doc.fontSize(20).text('CHECK-IN PASS', { align: 'center' });
            doc.moveDown();

            // Name large
            doc.fontSize(24).font('Helvetica-Bold').text(registration.Student.name, { align: 'center' });
            doc.fontSize(14).font('Helvetica').text(registration.registration_code, { align: 'center' });
            doc.moveDown();

            // QR Code Large
            const baseUrl = process.env.BASE_URL || 'https://coe.egspec.org';
            const qrData = `${baseUrl}/api/v1/register/details?id=${registration.registration_code}&public=yes`;
            const qrCodeDataUrl = await QRCode.toDataURL(qrData);

            doc.image(qrCodeDataUrl, (pageWidth - 100) / 2, doc.y, { fit: [100, 100] });

            doc.moveDown(8);
            doc.fontSize(12).text(`Sport: ${registration.Sport.name}`, { align: 'center' });
            doc.text(`College: ${registration.Student.College?.name || 'Other'}`, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
