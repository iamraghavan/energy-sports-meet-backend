const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const path = require('path');
const fs = require('fs');

// Helper to convert image file to Base64
const getBase64Image = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).slice(1);
            const data = fs.readFileSync(filePath);
            return `data:image/${ext};base64,${data.toString('base64')}`;
        }
    } catch (err) {
        console.error("Error reading image:", err);
    }
    return null;
};

/**
 * Generate HTML for Check-in Passes (One pass per sport, each on a separate page)
 * @param {Object} registration 
 * @returns {Promise<string>} HTML String
 */
exports.generatePassHTML = async (registration) => {
    // 1. Generate QR Code
    const baseUrl = process.env.BASE_URL || 'https://energy.egspgroup.in';
    const qrData = `${baseUrl}/energy/2026/checkin?id=${registration.registration_code}`;
    const qrImage = await QRCode.toDataURL(qrData);

    // 2. Generate Barcode (Code128)
    const barcodeBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: registration.registration_code,
        scale: 2,
        height: 10,
        includetext: true,
        textxalign: 'center',
        padding: 5,
        backgroundcolor: 'ffffff'
    });
    const barcodeImage = `data:image/png;base64,${barcodeBuffer.toString('base64')}`;

    // 3. Get Logo
    const logoPath = path.join(process.cwd(), 'src/public/Energy_college_logo.png');
    const logoImage = getBase64Image(logoPath);

    // 4. Format Data
    const regData = registration.dataValues || registration;
    const name = regData.name || "N/A";
    const code = regData.registration_code;
    const mobile = regData.mobile || "N/A";
    const email = regData.email || "N/A";
    const paymentStatus = (regData.payment_status || 'pending').toUpperCase();
    const accommodation = regData.accommodation_needed ? 'Yes' : 'No';
    const gender = regData.gender || "N/A";
    const college = regData.college_name || "Unknown College";
    
    // 5. Generate Cards for each sport
    const sports = regData.Sports && regData.Sports.length > 0 ? regData.Sports : [{ name: 'N/A', category: 'N/A' }];
    
    let passCardsHtml = sports.map((sportItem, index) => {
        const sportName = sportItem.name;
        const sportCategory = sportItem.category;
        const amountPerSport = parseFloat(regData.total_amount || 0) / sports.length;

        return `
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo-area">
        ${logoImage ? `<img src="${logoImage}" alt="Logo">` : 'ENERGY SPORTS'}
    </div>
    <div class="pass-title">
        <div class="pass-title-main">ENERGY '26</div>
        <div class="pass-title-sub">STUDENT PASS</div>
    </div>
  </div>

  <div class="greeting">
    Hello <strong>${name}</strong>,<br>
    Your registration for <strong>${sportName}</strong> at <strong>Energy Sports Meet 2026</strong> is confirmed.
  </div>

  <!-- Participant Details -->
  <div class="section-title" style="margin-top:5px">Participant Details</div>
  <table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Gender</th>
            <th>College</th>
            <th>Mobile</th>
            <th>Reg. ID</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>${name}</td>
            <td>${gender}</td>
            <td>${college}</td>
            <td>${mobile}</td>
            <td style="font-weight:bold">${code}</td>
        </tr>
    </tbody>
  </table>

  <!-- Event/Sport Details -->
  <div class="section-title">Event Specific Details</div>
  <table>
    <thead>
        <tr>
            <th>Tournament Event</th>
            <th>Category</th>
            <th>Accommodation</th>
            <th>Status</th>
            <th>Payment</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="font-size:14px; font-weight:bold; color:#0056b3">${sportName}</td>
            <td>${sportCategory}</td>
            <td>${accommodation}</td>
            <td>${(regData.status || 'Pending').toUpperCase()}</td>
            <td style="color:${paymentStatus === 'PAID' ? 'green' : 'red'}; font-weight:bold">${paymentStatus}</td>
        </tr>
    </tbody>
  </table>

  <!-- Footer Codes -->
  <div class="footer-codes">
    <div>
        <div class="section-title" style="margin-top:0">Event Entry Ticket</div>
        <div style="font-size:14px; font-weight:bold; color:#d32f2f">VALID FOR ${sportName.toUpperCase()}</div>
        <div style="font-size:8px; color:#666; margin-top:2px;">Scan QR at the venue gate for check-in</div>
    </div>
    
    <div style="text-align:center">
        <img src="${barcodeImage}" style="height:30px;"><br>
        <span style="font-size:8px;">${code}</span>
    </div>

    <div>
        <img src="${qrImage}" style="height:65px;">
    </div>
  </div>
</div>
        `;
    }).join('');

    // 6. Return Final HTML Template
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Passes - ${code}</title>
<style>
/* PRINT SETTINGS */
@page {
  size: A4 portrait;
  margin: 0;
}

body {
  margin: 0;
  background: #f0f0f0;
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #333;
  -webkit-print-color-adjust: exact;
}

.page {
  width: 210mm;
  height: 148.5mm; /* Exactly half of A4 height */
  margin: 0 auto;
  box-sizing: border-box;
  padding: 10mm;
  display: flex;
  flex-direction: column;
  position: relative;
  background: white;
  border-bottom: 1px dashed #bbb;
  page-break-after: always;
  break-after: page;
}

@media print {
    body { background: white; }
    .page { 
        border-bottom: none;
        width: 100%;
        height: 148.5mm;
    }
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #0056b3;
  padding-bottom: 8px;
  margin-bottom: 5px;
}

.logo-area img { height: 40px; }
.logo-area { font-size: 20px; font-weight: bold; color: #004080; }

.pass-title { text-align: right; font-weight: 900; color: #004080; line-height: 1.2; }
.pass-title-main { font-size: 18px; letter-spacing: 1px; }
.pass-title-sub { font-size: 12px; opacity: 0.8; }

/* GREETING */
.greeting { font-size: 11px; margin-bottom: 15px; margin-top: 5px; line-height: 1.4; }
.greeting strong { color: #0056b3; }

/* TABLES STYLES */
.section-title { font-size: 11px; font-weight: bold; color: #0056b3; margin-bottom: 4px; margin-top: 12px; text-transform: uppercase; letter-spacing: 0.5px; }

table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
th { background-color: #f7f9fc; color: #555; font-weight: bold; text-align: left; padding: 6px 8px; border: 1px solid #dee2e6; }
td { padding: 6px 8px; border: 1px solid #dee2e6; color: #333; vertical-align: middle; }

/* FOOTER CODES */
.footer-codes { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; border-top: 1px solid #eee; }
.barcode img { height: 25px; }
.qr img { height: 60px; }

</style>
</head>
<body>
    ${passCardsHtml}
</body>
</html>
    `;
};
