const colors = {
    primary:    '#0044cc',      // Main brand blue
    primaryDark:'#003399',
    text:       '#0f172a',      // Near-black for body
    textLight:  '#334155',
    muted:      '#64748b',
    border:     '#cbd5e1',
    bg:         '#f8fafc',
    card:       '#ffffff',
    success:    '#15803d',
    danger:     '#dc2626',
    warning:    '#d97706',
    info:       '#1d4ed8'
};

/**
 * Base Professional & Lightweight Email Template
 * Clean blue + white + dark text theme • 2025 best practices
 */
const baseTemplate = (content, previewText = '', subjectHint = '') => `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <title>${subjectHint || 'Energy Sports Meet 2026'}</title>

    <!-- Preheader -->
    <style type="text/css">
        #preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>

    <style type="text/css">
        :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
        }

        body {
            margin: 0;
            padding: 0;
            background: ${colors.bg};
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: ${colors.text};
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: 100%;
            font-size: 16px;
            line-height: 1.6;
        }

        table { border-collapse: collapse; }
        a { color: ${colors.primary}; text-decoration: underline; }
        img { border: 0; max-width: 100%; height: auto; }

        .wrapper {
            background: ${colors.bg};
            padding: 40px 16px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: ${colors.card};
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }

        .header {
            background: ${colors.primary};
            padding: 36px 32px 28px;
            text-align: center;
        }

        .logo {
            color: white;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-decoration: none;
        }

        .content {
            padding: 32px;
        }

        h1 {
            margin: 0 0 20px;
            font-size: 26px;
            font-weight: 700;
            color: ${colors.text};
            line-height: 1.25;
        }

        h2 {
            margin: 32px 0 16px;
            font-size: 20px;
            font-weight: 600;
            color: ${colors.text};
        }

        p {
            margin: 0 0 16px;
            color: ${colors.textLight};
        }

        .btn {
            display: inline-block;
            background: ${colors.primary};
            color: white !important;
            font-weight: 600;
            font-size: 16px;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            margin: 24px 0;
            box-shadow: 0 2px 8px rgba(0,68,204,0.25);
        }

        .btn:hover {
            background: ${colors.primaryDark};
        }

        .info-table {
            width: 100%;
            margin: 24px 0;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 10px 0;
            border-bottom: 1px solid ${colors.border};
            vertical-align: top;
        }

        .info-label {
            color: ${colors.muted};
            font-weight: 500;
            width: 38%;
            padding-right: 16px;
        }

        .info-value {
            font-weight: 600;
            color: ${colors.text};
        }

        .alert {
            padding: 16px 20px;
            border-radius: 8px;
            margin: 24px 0;
            font-size: 15px;
            border-left: 4px solid;
        }

        .alert-success { background: #f0fdf4; border-color: ${colors.success}; color: #14532d; }
        .alert-info    { background: #eff6ff; border-color: ${colors.info};    color: #1e40af; }
        .alert-warning { background: #fffbeb; border-color: ${colors.warning}; color: #92400e; }
        .alert-danger  { background: #fef2f2; border-color: ${colors.danger};  color: #991b1b; }

        .footer {
            background: #f1f5f9;
            padding: 28px 32px;
            text-align: center;
            font-size: 13px;
            color: ${colors.muted};
            line-height: 1.5;
        }

        .footer a { color: ${colors.muted}; }

        @media (max-width: 600px) {
            .container { border-radius: 0; }
            .content { padding: 24px !important; }
            .info-table td { display: block; width: 100% !important; padding: 8px 0; }
            .info-label { width: 100%; font-weight: 600; }
            .btn { width: 100%; box-sizing: border-box; text-align: center; }
        }

        @media (prefers-color-scheme: dark) {
            body { background: #0f172a; color: #e2e8f0; }
            .container { background: #1e293b; }
            .content { color: #cbd5e1; }
            h1, h2 { color: #f1f5f9; }
            .info-label { color: #94a3b8; }
            .footer { background: #111827; color: #94a3b8; }
            .alert-success { background: #14532d33; border-color: #4ade80; color: #bbf7d0; }
            .alert-info    { background: #1e40af33; border-color: #60a5fa; color: #bfdbfe; }
        }
    </style>
</head>
<body>

    <div id="preheader">${previewText} ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌</div>

    <div class="wrapper">
        <div class="container">

            <div class="header">
                <div class="logo">ENERGY SPORTS MEET 2026</div>
            </div>

            <div class="content">
                ${content}
            </div>

            <div class="footer">
                <p>Energy Sports Meet 2026<br>E.G.S. Pillay Group of Institutions<br>Nagapattinam, Tamil Nadu, India</p>
                <p>
                    <a href="https://energy.egspgroup.in">Official Website</a>  • 
                    <a href="mailto:help@egspgroup.in">Support</a>
                </p>
                <p style="margin-top: 16px; font-size: 12px;">
                    This is an automated message regarding your registration or participation.
                </p>
            </div>

        </div>
    </div>

</body>
</html>
`;

// ────────────────────────────────────────────────
// UI Components
// ────────────────────────────────────────────────

const InfoSection = (items) => {
    const rows = items.map(item => `
        <tr>
            <td class="info-label">${item.label}</td>
            <td class="info-value">${item.value}</td>
        </tr>
    `).join('');

    return `<table class="info-table" role="presentation">${rows}</table>`;
};

const Alert = (type, message) => `
    <div class="alert alert-${type}">
        ${message}
    </div>
`;

// ────────────────────────────────────────────────
// Exported Templates (improved versions)
// ────────────────────────────────────────────────

exports.getOTPEmailTemplate = (otp) => {
    const html = baseTemplate(`
        <h1>Verification Code</h1>
        <p>Use the code below to verify your email and complete login to the Energy Sports Meet portal.</p>

        <div style="margin: 32px 0; text-align: center;">
            <div style="
                font-family: 'Courier New', monospace;
                font-size: 40px;
                font-weight: 700;
                letter-spacing: 8px;
                color: ${colors.primary};
                background: #f1f5f9;
                padding: 16px 32px;
                border-radius: 8px;
                border: 1px solid ${colors.border};
                display: inline-block;
            ">${otp}</div>
        </div>

        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn’t request this, please ignore this email.</p>
    `, `Your verification code: ${otp}`, 'Verify your email');

    const text = `Verification Code: ${otp}\n\nValid for 10 minutes.\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getRegistrationReceiptTemplate = (data) => {
    const html = baseTemplate(`
        <h1>Registration Received</h1>
        <p>Hello <strong>${data.name}</strong>,</p>
        <p>Thank you for registering for <strong>${data.sportName}</strong>. We have received your application and are now reviewing the details.</p>

        ${Alert('info', '<strong>Current status:</strong> Pending Verification<br>You will receive a confirmation once approved.')}

        ${InfoSection([
            { label: 'Registration Code', value: data.regCode },
            { label: 'Sport / Event',      value: data.sportName },
            { label: 'Event Dates',       value: '12–14 March 2026' }
        ])}

        <a href="https://energy.egspgroup.in/status" class="btn">Check Status</a>
    `, `Registration received – ${data.sportName}`);

    const text = `Registration Received\n\nHello ${data.name},\nCode: ${data.regCode}\nEvent: ${data.sportName}\nStatus: Pending\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getRegistrationApprovalTemplate = (data) => {
    const html = baseTemplate(`
        <h1 style="color: ${colors.success};">Registration Approved ✓</h1>
        <p>Hello <strong>${data.name}</strong>,</p>
        <p>Your registration for <strong>${data.sportName}</strong> has been approved.</p>

        <p><strong>Your entry pass is attached.</strong> Please present it (digital or printed) at the venue.</p>

        ${InfoSection([
            { label: 'Registration Code', value: data.regCode },
            { label: 'Status',            value: 'Confirmed' },
            { label: 'Reporting Time',    value: '08:30 AM' }
        ])}

        <p><strong>Please bring:</strong> College ID + entry pass</p>

        <a href="https://energy.egspgroup.in/dashboard" class="btn">View Dashboard</a>
    `, `Approved: ${data.sportName}`);

    const text = `Registration Approved\n\nHello ${data.name},\n${data.sportName} – Confirmed\nEntry pass attached.\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getRegistrationRejectionTemplate = (data) => {
    const html = baseTemplate(`
        <h1 style="color: ${colors.danger};">Action Required</h1>
        <p>Hello <strong>${data.name}</strong>,</p>
        <p>We couldn’t verify your registration for <strong>${data.sportName}</strong>.</p>

        ${Alert('danger', `<strong>Reason:</strong><br>${data.reason || 'Details could not be verified. Please review and resubmit.'}`)}

        <p>Please log in to update your information or upload correct documents.</p>

        <a href="https://energy.egspgroup.in/login" class="btn">Resolve Issue</a>
    `, `Action required: ${data.sportName}`);

    const text = `Action Required\n\nHello ${data.name},\nIssue with ${data.sportName} registration.\nReason: ${data.reason || 'Verification failed'}\nPlease login to correct.\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getMatchScheduledTemplate = (data) => {
    const html = baseTemplate(`
        <h1>Match Scheduled</h1>
        <p>A match has been scheduled in <strong>${data.sportName}</strong>.</p>

        <div style="
            background: #f1f5f9;
            padding: 24px;
            border-radius: 8px;
            text-align: center;
            margin: 24px 0;
            font-size: 18px;
            font-weight: 600;
        ">
            ${data.teamAName} <span style="color:${colors.muted}; margin:0 12px;">vs</span> ${data.teamBName}
        </div>

        ${InfoSection([
            { label: 'Date & Time', value: data.startTime },
            { label: 'Venue',       value: data.venue || 'Main Sports Ground' }
        ])}

        <p>Please arrive at least 30 minutes early.</p>

        <a href="https://energy.egspgroup.in/matches/${data.matchId}" class="btn">View Details</a>
    `, `${data.teamAName} vs ${data.teamBName} scheduled`);

    const text = `Match Scheduled\n\n${data.teamAName} vs ${data.teamBName}\n${data.startTime}\n${data.venue || 'Main Ground'}\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getMatchLiveTemplate = (data) => {
    const html = baseTemplate(`
        <h1 style="color: ${colors.danger};">Match Started – Live Now</h1>
        <p>The match <strong>${data.teamAName} vs ${data.teamBName}</strong> is underway.</p>

        <div style="text-align:center; margin:32px 0;">
            <div style="font-size:20px; font-weight:700;">${data.teamAName} vs ${data.teamBName}</div>
            <div style="color:${colors.muted};">${data.sportName}</div>
        </div>

        <p>Follow live scores and updates on the portal.</p>

        <a href="https://energy.egspgroup.in/live" class="btn">Watch Live</a>
    `, `Live: ${data.teamAName} vs ${data.teamBName}`);

    const text = `Match Live Now\n\n${data.teamAName} vs ${data.teamBName}\n${data.sportName}\nLive: https://energy.egspgroup.in/live\n\nEnergy Sports Meet 2026`;
    return { html, text };
};

exports.getMatchResultTemplate = (data) => {
    const html = baseTemplate(`
        <h1>Match Result</h1>
        <p>The match <strong>${data.teamAName} vs ${data.teamBName}</strong> has ended.</p>

        <div style="
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 24px;
            border-radius: 8px;
            text-align: center;
            margin: 24px 0;
        ">
            <div style="font-size:14px; text-transform:uppercase; color:#166534; font-weight:600;">Winner</div>
            <div style="font-size:28px; font-weight:800; color:#15803d; margin:8px 0;">${data.winnerName}</div>
            <div style="font-size:16px;">${data.finalScore}</div>
        </div>

        <a href="https://energy.egspgroup.in/matches/${data.matchId}" class="btn">View Details</a>
    `, `${data.winnerName} won`);

    const text = `Match Result\n\nWinner: ${data.winnerName}\nScore: ${data.finalScore}\n\nEnergy Sports Meet 2026`;
    return { html, text };
};