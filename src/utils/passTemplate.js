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
 * Generate HTML for Check-in Pass (A5 Landscape - EaseMyTrip Style)
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
    
    // Join sports if multiple
    let sport = "N/A";
    let category = "N/A";
    let amount = regData.total_amount || 0;
    
    if (regData.Sports && regData.Sports.length > 0) {
        sport = regData.Sports.map(s => s.name).join(', ');
        category = regData.Sports[0].category; 
    }

    const createdDate = new Date(regData.created_at || Date.now()).toDateString();
    const createdTime = new Date(regData.created_at || Date.now()).toLocaleTimeString();

    // 5. Return HTML Template (A5 Landscape - Flight Ticket Style)
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Pass - ${code}</title>
<style>
/* PRINT SETTINGS */
@page {
  size: A4 portrait; /* Print on standard A4 */
  margin: 0;
}

body {
  margin: 0;
  background: white;
  font-family: Arial, Helvetica, sans-serif;
  color: #333;
  -webkit-print-color-adjust: exact;
}

.page {
  /* Strictly A5 Landscape dimensions */
  width: 210mm;
  height: 148mm;
  /* margin: 0 auto; Removed auto margin to stick to top */
  box-sizing: border-box;
  padding: 10mm;
  display: flex;
  flex-direction: column;
  position: relative;
  background: white;
  border-bottom: 2px dashed #ccc; /* Cut line visualization */
}

@media print {
    .page { border-bottom: none; } /* Optional: remove border when printing if preferred */
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #efefef;
  padding-bottom: 8px;
  margin-bottom: 5px;
}

.logo-area img {
    height: 40px;
}
.logo-area {
    font-size: 20px;
    font-weight: bold;
    color: #004080;
}

.pass-title {
    text-align: right;
    font-weight: 900;
    color: #004080;
    line-height: 1.2;
}
.pass-title-main { font-size: 18px; letter-spacing: 1px; }
.pass-title-sub { font-size: 12px; opacity: 0.8; }

/* GREETING */
.greeting {
    font-size: 11px;
    margin-bottom: 15px;
    margin-top: 5px;
}
.greeting strong {
    color: #0056b3; 
}

/* TABLES STYLES (Blue Header) */
.section-title {
    font-size: 12px;
    font-weight: bold;
    color: #0056b3;
    margin-bottom: 4px;
    margin-top: 15px;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    margin-bottom: 8px;
}

th {
    background-color: #e3f2fd; /* Light Blue */
    color: #000;
    font-weight: bold;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #dee2e6;
}

td {
    padding: 6px 8px;
    border: 1px solid #dee2e6;
    color: #333;
}

/* FOOTER CODES */
.footer-codes {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 10px;
    border-top: 1px dashed #ccc;
}

.barcode img { height: 25px; }
.qr img { height: 60px; }

</style>
</head>
<body>

<div class="page">
  
  <!-- Header -->
  <div class="header">
    <div class="logo-area">
        ${logoImage ? `<img src="${logoImage}" alt="Logo">` : 'ENERGY SPORTS'}
    </div>
    <div class="pass-title">
        <div class="pass-title-main">ENERGY '26</div>
        <div class="pass-title-sub">CHECK-IN PASS</div>
    </div>
  </div>

  <div class="greeting">
    Hi <strong>${name}</strong>,<br>
    Your registration for <strong>Energy Sports Meet 2026</strong> is confirmed. Registration ID: <span style="color:#0056b3">${code}</span>.
  </div>

  <!-- Passenger / Student Info -->
  <div class="section-title" style="margin-top:5px">Participant Details</div>
  <table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Gender</th>
            <th>College</th>
            <th>Category</th>
            <th>Reg. Code</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>${name}</td>
            <td>${gender}</td>
            <td>${college}</td>
            <td>${category}</td>
            <td style="font-weight:bold">${code}</td>
        </tr>
    </tbody>
  </table>

  <!-- Sports Inclusion -->
  <div class="section-title">Sports Inclusion</div>
  <table>
    <thead>
        <tr>
            <th>Events Registered</th>
            <th>Accommodation</th>
            <th>Payment Status</th>
            <th>Mobile</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>${sport}</td>
            <td>${accommodation}</td>
            <td style="color:${paymentStatus === 'PAID' ? 'green' : 'red'}; font-weight:bold">${paymentStatus}</td>
            <td>${mobile}</td>
        </tr>
    </tbody>
  </table>

  <!-- Footer Codes -->
  <div class="footer-codes">
    <div>
        <div class="section-title" style="margin-top:0">Total Amount</div>
        <div style="font-size:16px; font-weight:bold; color:#0056b3">Rs. ${amount}</div>
        <div style="font-size:8px; color:#666; margin-top:2px;">Includes all taxes & fees</div>
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

</body>
</html>
    `;
};
