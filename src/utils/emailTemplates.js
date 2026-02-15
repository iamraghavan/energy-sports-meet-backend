const colors = {
    brand: '#0044cc', // Deep Blue (similar to the image)
    brandDark: '#003399',
    text: '#1a1a1a',
    textMuted: '#666666',
    border: '#e5e7eb',
    bg: '#f2f4f6',
    card: '#ffffff',
    success: '#008a00',
    danger: '#d93025'
};

/**
 * Base Responsive Template - Flash Design Style
 * Solid Blue Header, Clean White Card, Left-Aligned Typography
 */
const baseTemplate = (content, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Energy Sports Meet 2026</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
    <![endif]-->
    <style>
        body { margin: 0; padding: 0; width: 100% !important; background-color: ${colors.bg}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: ${colors.text}; }
        table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        
        .wrapper { width: 100%; background-color: ${colors.bg}; padding: 40px 0; }
        .main-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: transparent; }
        
        /* Header - Solid Blue Rounded Top */
        .header { background-color: ${colors.brand}; padding: 30px 40px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: left; }
        .header-logo { color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px; text-decoration: none; }
        
        /* Card Body */
        .card { background-color: ${colors.card}; padding: 40px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        
        /* Typography */
        h1 { margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: ${colors.brandDark}; line-height: 1.3; }
        h2 { margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: ${colors.text}; }
        p { margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${colors.text}; }
        
        /* Components */
        .button { background-color: ${colors.brand}; color: #ffffff !important; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; margin: 24px 0 8px 0; text-align: center; border: none; }
        .button:hover { background-color: ${colors.brandDark}; }
        
        .divider { border-top: 1px solid ${colors.border}; margin: 24px 0; }
        
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 8px 0; border-bottom: 1px solid ${colors.border}; font-size: 15px; }
        .info-label { color: ${colors.textMuted}; width: 40%; }
        .info-value { font-weight: 600; color: ${colors.text}; text-align: right; }
        
        .alert-box { padding: 16px; border-radius: 6px; background-color: #f8f9fa; border: 1px solid ${colors.border}; margin: 20px 0; font-size: 14px; color: ${colors.text}; }
        
        /* Footer */
        .footer { padding-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.5; }
        .footer a { color: #9ca3af; text-decoration: underline; }
        
        @media screen and (max-width: 600px) {
            .wrapper { padding: 20px 10px; }
            .header { padding: 24px; }
            .card { padding: 24px; }
            h1 { font-size: 22px; }
        }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0px; overflow: hidden;">
        ${previewText}
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
    
    <div class="wrapper">
        <div class="main-container">
            <!-- Header with Logo -->
            <div class="header">
                <a href="#" class="header-logo">
                    <!-- Simple Logo / Brand Name -->
                    ENERGY SPORTS MEET
                </a>
            </div>
            
            <!-- White Card Content -->
            <div class="card">
                ${content}
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>
                    Energy Sports Meet 2026<br>
                    E.G.S. Pillay Group of Institutions<br>
                    Nagapattinam, Tamil Nadu
                </p>
                <p>
                    <a href="https://energy.egspgroup.in">Official Website</a> &bull; <a href="mailto:help@egspgroup.in">Contact Support</a>
                </p>
                <p style="margin-top: 20px; font-size: 11px;">
                    You received this email regarding your registration/participation.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;

// --- UI Helpers ---

const InfoSection = (items) => {
    const rows = items.map(item => `
        <tr>
            <td class="info-label">${item.label}</td>
            <td class="info-value">${item.value}</td>
        </tr>
    `).join('');
    
    return `<table class="info-table">${rows}</table>`;
};

// --- Exported Templates ---

exports.getOTPEmailTemplate = (otp) => {
    const html = baseTemplate(`
        <h1>Verify your email address</h1>
        <p>You recently requested to log in to the Energy Sports Meet portal. Use the code below to complete the verification process.</p>
        
        <div style="margin: 32px 0; text-align: left;">
            <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: ${colors.brand}; letter-spacing: 4px; border: 2px solid ${colors.border}; padding: 12px 24px; border-radius: 6px; background-color: #f8f9fa;">${otp}</span>
        </div>
        
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, you can safely ignore this email.</p>
    `, `Your verification code is ${otp}`);

    const text = `Verification Code: ${otp}\n\nUse this code to complete your login. Valid for 10 minutes.\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getRegistrationReceiptTemplate = (data) => {
    const html = baseTemplate(`
        <h1>Registration Received</h1>
        <p>Hello <strong>${data.name}</strong>,</p>
        <p>We have received your registration for <strong>${data.sportName}</strong>. Our team is currently verifying the details and payment proof.</p>
        
        <div class="alert-box">
            <strong>Status: Pending Verification</strong><br>
            You will receive a confirmation email with your entry ticket once approved.
        </div>
        
        ${InfoSection([
            { label: 'Registration Code', value: data.regCode },
            { label: 'Event', value: data.sportName },
            { label: 'Date', value: '12-14 March 2026' }
        ])}
        
        <a href="https://energy.egspgroup.in/status" class="button">Check Application Status</a>
    `, `Registration received: ${data.sportName}`);

    const text = `Registration Received\n\nHello ${data.name},\nWe received your registration for ${data.sportName}.\nCode: ${data.regCode}\nStatus: Pending Verification\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getRegistrationApprovalTemplate = (data) => {
    const html = baseTemplate(`
        <h1 style="color: ${colors.success};">Registration Approved</h1>
        <p>Hello <strong>${data.name}</strong>,</p>
        <p>Good news! Your registration for <strong>${data.sportName}</strong> has been approved.</p>
        
        <p><strong>Your entry pass is attached to this email.</strong> Please download and present it at the venue.</p>
        
        ${InfoSection([
            { label: 'Registration Code', value: data.regCode },
            { label: 'Status', value: 'Confirmed' },
            { label: 'Reporting Time', value: '08:30 AM' }
        ])}
        
        <p style="margin-top: 24px;"><strong>Important:</strong> Bring your college ID card along with the entry pass.</p>
        
        <a href="https://energy.egspgroup.in/dashboard" class="button">Go to Dashboard</a>
    `, `Registration Approved: ${data.sportName}`);

    const text = `Registration Approved\n\nHello ${data.name},\nYour registration for ${data.sportName} is approved.\nPlease check the attached ticket.\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getRegistrationRejectionTemplate = (data) => {
    const html = baseTemplate(`
        <h1 style="color: ${colors.danger};">Action Required</h1>
        <p>Hello <strong>${data.name}</strong>,</p>
        <p>There was an issue verifying your registration for <strong>${data.sportName}</strong>.</p>
        
        <div class="alert-box" style="border-left: 4px solid ${colors.danger};">
            <strong>Reason:</strong><br>
            ${data.reason || 'Verification failed. Please check your details.'}
        </div>
        
        <p>Please log in to the portal to correct the information or upload a valid payment proof.</p>
        
        <a href="https://energy.egspgroup.in/login" class="button">Fix Issue</a>
    `, `Action Required: ${data.sportName} Registration`);

    const text = `Action Required\n\nHello ${data.name},\nThere is an issue with your registration for ${data.sportName}.\nReason: ${data.reason}\n\nPlease login to fix it.\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getMatchScheduledTemplate = (data) => {
    const html = baseTemplate(`
        <h1>Match Scheduled</h1>
        <p>A new match has been scheduled for <strong>${data.sportName}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; margin: 24px 0;">
            <div style="font-size: 18px; font-weight: 700; color: ${colors.brandDark};">
                ${data.teamAName} <span style="color: #999; font-weight: 400; margin: 0 8px;">vs</span> ${data.teamBName}
            </div>
        </div>
        
        ${InfoSection([
            { label: 'Date & Time', value: data.startTime },
            { label: 'Venue', value: data.venue || 'Sports Ground' }
        ])}
        
        <p>Please report 30 minutes before the scheduled start time.</p>
        
        <a href="https://energy.egspgroup.in/matches/${data.matchId}" class="button">View Match Details</a>
    `, `Match Scheduled: ${data.teamAName} vs ${data.teamBName}`);

    const text = `Match Scheduled\n\n${data.teamAName} vs ${data.teamBName}\nTime: ${data.startTime}\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getMatchLiveTemplate = (data) => {
    const html = baseTemplate(`
        <h1 style="color: ${colors.danger};">Match is Live</h1>
        <p>The match between <strong>${data.teamAName}</strong> and <strong>${data.teamBName}</strong> has started.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 20px; font-weight: 700;">${data.teamAName} vs ${data.teamBName}</div>
            <div style="font-size: 14px; color: ${colors.textMuted}; margin-top: 4px;">${data.sportName}</div>
        </div>
        
        <p>Follow the real-time score and commentary on the dashboard.</p>
        
        <a href="https://energy.egspgroup.in/live" class="button">Watch Live Score</a>
    `, `Live: ${data.teamAName} vs ${data.teamBName}`);

    const text = `Match is Live\n\n${data.teamAName} vs ${data.teamBName}\nFollow here: https://energy.egspgroup.in/live\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getMatchResultTemplate = (data) => {
    const html = baseTemplate(`
        <h1>Match Result</h1>
        <p>The match between <strong>${data.teamAName}</strong> and <strong>${data.teamBName}</strong> has concluded.</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 6px; text-align: center; margin: 24px 0;">
            <div style="font-size: 14px; text-transform: uppercase; color: #166534; font-weight: 700;">Winner</div>
            <div style="font-size: 24px; font-weight: 800; color: #15803d; margin: 8px 0;">${data.winnerName}</div>
            <div style="font-size: 16px; color: ${colors.text}; margin-top: 8px;">Score: ${data.finalScore}</div>
        </div>
        
        <a href="https://energy.egspgroup.in/matches/${data.matchId}" class="button">View Highlights</a>
    `, `Result: ${data.winnerName} won`);

    const text = `Match Result\n\nWinner: ${data.winnerName}\nScore: ${data.finalScore}\n\nEnergy Sports Meet 2026`;
    return { html, text };
};
