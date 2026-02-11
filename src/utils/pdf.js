const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate Registration Confirmation PDF
 * @param {Object} registration - Registration details including student, sport, etc.
 * @returns {Promise<Buffer>} - PDF Buffer
 */
exports.generateConfirmationPDF = async (registration) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Generate QR Code
            const qrCodeDataUrl = await QRCode.toDataURL(registration.registration_code);

            // Header
            doc.fontSize(20).text('Energy Sports Meet 2026', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).text('Registration Confirmation', { align: 'center' });
            doc.moveDown();

            // QR Code Image
            doc.image(qrCodeDataUrl, {
                fit: [100, 100],
                align: 'center',
                valign: 'center'
            });
            doc.moveDown(5);

            // Details
            doc.fontSize(12).text(`Registration ID: ${registration.registration_code}`);
            doc.text(`Student Name: ${registration.Student.name}`);
            doc.text(`College: ${registration.Student.College ? registration.Student.College.name : 'N/A'}`);
            doc.text(`Sport: ${registration.Sport.name}`);
            doc.text(`Category: ${registration.Sport.type}`);

            if (registration.Team) {
                doc.text(`Team Name: ${registration.Team.team_name}`);
            }

            doc.text(`Accommodation Needed: ${registration.accommodation_needed ? 'Yes' : 'No'}`);
            doc.moveDown();

            doc.fontSize(14).text('Payment Status: PAID & VERIFIED', { color: 'green' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};
