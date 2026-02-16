const QRCode = require('qrcode');
const bwipjs = require('bwip-js');
const path = require('path');
const fs = require('fs');

/**
 * Generate HTML for Check-in Pass
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
        height: 15,
        includetext: false, // Text is displayed below manually in HTML
        padding: 5,
        backgroundcolor: 'ffffff'
    });
    const barcodeImage = `data:image/png;base64,${barcodeBuffer.toString('base64')}`;

    // 3. Format Data
    const name = registration.name || registration.dataValues?.name; // Handle potential structure diff
    const code = registration.registration_code;
    const paymentStatus = registration.payment_status.toUpperCase();
    
    // Join sports if multiple
    let sport = "N/A";
    let category = "N/A";
    if (registration.Sports && registration.Sports.length > 0) {
        sport = registration.Sports.map(s => s.name).join(', ');
        category = registration.Sports[0].category; // Assuming same category or taking first
    }

    const college = registration.college_name || "Unknown College";
    const gender = registration.gender || "N/A";
    const checkinTime = registration.checked_in && registration.checkin_time 
        ? new Date(registration.checkin_time).toLocaleTimeString() 
        : "Not Checked In";

    // 4. Return HTML Template
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Check-in Pass - ${code}</title>
<style>
/* PRINT SETTINGS */
@page {
  size: A4 landscape;
  margin: 0;
}

body {
  margin: 0;
  background: #e0e0e0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-print-color-adjust: exact;
}

/* A4 container (Landscape) */
.page {
  width: 297mm;
  height: 210mm;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* PASS CARD (A5 roughly or custom size) */
.pass-container {
  width: 220mm;
  height: 90mm;
  display: flex;
  background: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  overflow: hidden;
  border-radius: 12px;
  position: relative;
}

/* WATERMARK */
.watermark {
    position: absolute;
    top: 50%;
    left: 40%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 80px;
    color: rgba(0,0,0,0.03);
    font-weight: bold;
    pointer-events: none;
    z-index: 0;
}

/* LEFT BARCODE STRIP */
.barcode-strip {
  width: 18mm;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 2px dashed #ddd;
  position: relative;
}

.barcode-strip img {
    transform: rotate(-90deg);
    /* width: 80mm; equivalent to height when rotated */
    max-width: 80mm; 
}

/* CENTER MAIN INFO */
.center {
  flex: 1;
  padding: 10mm 15mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 1;
}

/* RIGHT BLUE PANEL */
.right {
  width: 75mm;
  background: linear-gradient(135deg, #1f2d78 0%, #0d1642 100%);
  color: white;
  padding: 8mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
  position: relative;
}

/* HEADER */
.header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 15px;
}

.header-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #1f2d78;
  text-transform: uppercase;
}

.report-time {
    font-size: 10px;
    background: #eef2ff;
    color: #1f2d78;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
}

/* PLAYER NAME */
.name {
  font-size: 24px;
  font-weight: 800;
  color: #222;
  line-height: 1.2;
}

.code-badge {
  display: inline-block;
  font-size: 12px;
  background: #222;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 12px;
  margin-top: 4px;
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
  font-size: 12px;
  margin-top: 5px;
}

.field {
    display: flex;
    flex-direction: column;
}

.label {
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.value {
  font-weight: 600;
  color: #333;
  font-size: 13px;
}

/* RIGHT PANEL STYLES */
.event-logo-text {
    font-size: 16px;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 5px;
}

.event-sub {
    font-size: 10px;
    opacity: 0.8;
}

.qr-container {
    background: white;
    padding: 8px;
    border-radius: 8px;
    width: 38mm;
    height: 38mm;
    margin: 10px auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qr-container img {
    width: 100%;
    height: 100%;
}

.gate-info {
    font-size: 12px;
    font-weight: bold;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 5px;
    border-radius: 4px;
    margin-top: 5px;
}

.status-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 10px;
    background: #00ff88;
    color: #004422;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
}

/* Print Handling */
@media print {
    body { background: white; }
    .page { width: auto; height: auto; display: block; }
    .pass-container { 
        border: 1px solid #ddd; /* Better visibility on print */
        page-break-inside: avoid;
        margin: 10mm auto;
    }
}
</style>
</head>

<body>

<div class="page">
  <div class="pass-container">

    <div class="watermark">ENERGY 2026</div>

    <!-- BARCODE -->
    <div class="barcode-strip">
      <img src="${barcodeImage}">
    </div>

    <!-- CENTER INFO -->
    <div class="center">
      
      <div class="header-row">
          <div class="header-title">OFFICIAL ENTRY PASS</div>
          <div class="report-time">REPORT BEFORE 08:30 AM</div>
      </div>

      <div>
          <div class="name">${name}</div>
          <div class="code-badge">${code}</div>
      </div>

      <div class="grid">
        <div class="field">
          <div class="label">Participating Sport</div>
          <div class="value" style="color:#1f2d78">${sport}</div>
        </div>

        <div class="field">
          <div class="label">Category / Gender</div>
          <div class="value">${category} / ${gender}</div>
        </div>

        <div class="field">
          <div class="label">Representing College</div>
          <div class="value">${college}</div>
        </div>

        <div class="field">
           <div class="label">Payment Status</div>
           <div class="value" style="color: ${paymentStatus === 'PAID' ? 'green' : 'red'}">${paymentStatus}</div>
        </div>
      </div>

    </div>

    <!-- RIGHT PANEL -->
    <div class="right">
      
      ${registration.checked_in ? '<div class="status-badge">CHECKED IN</div>' : ''}

      <div>
        <div class="event-logo-text">ENERGY<br>SPORTS MEET</div>
        <div class="event-sub">2026 Edition</div>
      </div>

      <div class="qr-container">
        <img src="${qrImage}">
      </div>

      <div class="gate-info">
        ENTRY GATE 04
      </div>

    </div>

  </div>
</div>

<script>
    // Automatically open print dialog
    window.onload = function() {
        // Optional: window.print();
    }
</script>

</body>
</html>
    `;
};
