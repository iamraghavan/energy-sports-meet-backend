// --- Color Palette ---
const colors = {
    brand: '#0056b3',
    brandDark: '#003d82',
    accent: '#f39c12',
    success: '#28a745',
    danger: '#dc3545',
    text: '#333333',
    textMuted: '#666666',
    border: '#e9ecef',
    bg: '#f4f7f9',
    card: '#ffffff'
};

/**
 * Base Responsive Template
 * Uses nested tables for maximum email client compatibility (Outlook, Gmail, mobile)
 */
const baseTemplate = (content, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Energy Sports Meet 2026</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
    <![endif]-->
    <style>
        body { margin: 0; padding: 0; width: 100% !important; background-color: ${colors.bg}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        .wrapper { width: 100%; table-layout: fixed; background-color: ${colors.bg}; padding-bottom: 40px; }
        .main { background-color: ${colors.card}; margin: 0 auto; width: 100%; max-width: 600px; border-collapse: separate; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, ${colors.brandDark} 0%, ${colors.brand} 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
        .content { padding: 40px 30px; line-height: 1.6; color: ${colors.text}; font-size: 16px; }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: ${colors.textMuted}; background-color: #f8f9fa; border-top: 1px solid ${colors.border}; }
        .button { background-color: ${colors.brand}; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; margin-top: 20px; text-align: center; }
        .badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-row { border-bottom: 1px solid ${colors.border}; padding: 12px 0; }
        .info-label { color: ${colors.textMuted}; font-size: 14px; }
        .info-value { color: ${colors.text}; font-weight: bold; font-size: 16px; float: right; text-align: right; }
        
        @media screen and (max-width: 600px) {
            .content { padding: 30px 20px !important; }
            .header { padding: 30px 15px !important; }
            .info-value { float: none; display: block; text-align: left; margin-top: 4px; }
        }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0px; overflow: hidden;">
        ${previewText}
        &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
    <center class="wrapper">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center" style="padding: 20px 10px;">
                    <table class="main" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <!-- HERO HEADER -->
                        <tr>
                            <td class="header">
                                <!-- Minimal Icon/Logo Placeholder -->
                                <div style="font-size: 40px; line-height: 1; margin-bottom: 10px;">⚡</div>
                                <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px; text-transform: uppercase; font-weight: 800;">Energy Sports Meet</h1>
                                <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8; letter-spacing: 0.5px;">E.G.S. PILLAY GROUP OF INSTITUTIONS</p>
                            </td>
                        </tr>
                        <!-- CONTENT BODY -->
                        <tr>
                            <td class="content">
                                ${content}
                            </td>
                        </tr>
                        <!-- FOOTER -->
                        <tr>
                            <td class="footer">
                                <p style="margin: 0 0 10px 0; font-weight: bold; color: ${colors.text};">Energy Sports Meet 2026</p>
                                <p style="margin: 0 0 20px 0;">Nagapattinam, Tamil Nadu, India</p>
                                <p style="margin: 0 0 10px 0;">
                                    <a href="https://energy.egspgroup.in" style="color: ${colors.brand}; text-decoration: none; font-weight: bold;">Official Website</a> &nbsp;|&nbsp; 
                                    <a href="mailto:help@egspgroup.in" style="color: ${colors.brand}; text-decoration: none; font-weight: bold;">Support</a>
                                </p>
                                <p style="margin: 10px 0 0 0; font-size: 11px; color: #999;">
                                    You received this email because you registered for the event. <a href="#" style="color: #999; text-decoration: underline;">Unsubscribe</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                    <div style="margin-top: 20px; font-size: 12px; color: #999;">
                        &copy; 2026 E.G.S.P Group of Institutions. All rights reserved.
                    </div>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
`;

// --- UI Components (Helper Functions) ---

const StatusBadge = (status, type = 'accent') => {
    let bg = colors.accent;
    let color = '#fff';
    
    if (type === 'success') bg = colors.success;
    if (type === 'danger') bg = colors.danger;
    if (type === 'neutral') { bg = '#e9ecef'; color = '#495057'; }

    return `<span class="badge" style="background-color: ${bg}; color: ${color};">${status}</span>`;
};

const InfoRow = (label, value) => `
    <div class="info-row">
        <span class="info-label">${label}</span>
        <span class="info-value">${value}</span>
        <div style="clear: both;"></div>
    </div>
`;

const SectionTitle = (title) => `
    <h3 style="margin: 30px 0 15px 0; font-size: 18px; color: ${colors.brandDark}; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid ${colors.border}; padding-bottom: 8px; display: inline-block;">${title}</h3>
`;

const CalloutBox = (text, type = 'info') => {
    let bg = '#e3f2fd';
    let border = '#bbdefb';
    let color = '#0c5460';
    
    if (type === 'warning') { bg = '#fff3cd'; border = '#ffeeba'; color = '#856404'; }
    if (type === 'success') { bg = '#d4edda'; border = '#c3e6cb'; color = '#155724'; }
    if (type === 'danger') { bg = '#f8d7da'; border = '#f5c6cb'; color = '#721c24'; }
    if (type === 'otp') { bg = '#f8f9fa'; border = '#dee2e6'; color = '#333'; }

    return `
    <div style="background-color: ${bg}; border: 1px solid ${border}; color: ${color}; padding: 15px 20px; border-radius: 6px; margin: 20px 0; font-size: 15px;">
        ${text}
    </div>`;
};


// --- Template Exports ---

exports.getRegistrationReceiptTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; font-size: 24px;">Registration Received! 🎉</h2>
        <p>Hi <strong>${data.name}</strong>,</p>
        <p>Thanks for signing up! We've received your application for <strong>${data.sportName}</strong>.</p>
        
        ${CalloutBox('<strong>Status:</strong> Your registration is currently <em>PENDING VERIFICATION</em>. Our team is reviewing your payment proof.', 'warning')}

        ${SectionTitle('Summary')}
        ${InfoRow('Registration Code', `<span style="font-family: monospace; font-size: 18px; color: ${colors.brand};">${data.regCode}</span>`)}
        ${InfoRow('Event', data.sportName)}
        ${InfoRow('Current Status', StatusBadge('Pending', 'accent'))}

        <p style="margin-top: 30px;">You will receive a confirmation email once your entry is approved.</p>
        <a href="https://energy.egspgroup.in/status" class="button">Check Status</a>
    `, `Registration Received for ${data.sportName}`);

    const text = `ENERGY SPORTS MEET 2026\n\nRegistration Received!\n\nHi ${data.name},\nWe've received your application for ${data.sportName}.\nReg Code: ${data.regCode}\nStatus: Pending Verification\n\nWe'll notify you once approved.\nenergy.egspgroup.in`;
    return { html, text };
};

exports.getRegistrationApprovalTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: ${colors.success};">You're In! 🎫</h2>
        <p>Congratulations <strong>${data.name}</strong>,</p>
        <p>Your registration for <strong>${data.sportName}</strong> has been officially <strong>APPROVED</strong>.</p>
        
        ${CalloutBox(`
            <h4 style="margin: 0 0 10px 0; color: ${colors.success}; font-size: 16px;">✅ Your Ticket is Ready</h4>
            <p style="margin: 0;">Please find your official <strong>Entry Pass (PDF)</strong> attached to this email.</p>
        `, 'success')}

        ${SectionTitle('Event Info')}
        ${InfoRow('Registration Code', `<span style="font-family: monospace;">${data.regCode}</span>`)}
        ${InfoRow('Status', StatusBadge('Confirmed', 'success'))}
        
        ${SectionTitle('Instructions')}
        <ul style="padding-left: 20px; margin-top: 10px; color: ${colors.textMuted};">
            <li style="margin-bottom: 8px;">Keep the digital or printed ticket ready.</li>
            <li style="margin-bottom: 8px;">Bring your original <strong>College ID Card</strong>.</li>
            <li style="margin-bottom: 8px;">Report 45 minutes before the event start time.</li>
        </ul>

        <div style="text-align: center;">
            <a href="https://energy.egspgroup.in/dashboard" class="button">View Dashboard</a> 
        </div>
    `, `Confirmed! Your ${data.sportName} ticket is ready.`);

    const text = `ENERGY SPORTS MEET 2026\n\nCONFIRMED!\n\nHi ${data.name},\nYour registration for ${data.sportName} is approved. Your Ticket PDF is attached.\n\nReg Code: ${data.regCode}\n\nenergy.egspgroup.in`;
    return { html, text };
};

exports.getRegistrationRejectionTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: ${colors.danger};">Action Required ⚠️</h2>
        <p>Hi <strong>${data.name}</strong>,</p>
        <p>We encountered an issue while verifying your registration for <strong>${data.sportName}</strong>.</p>
        
        ${CalloutBox(`
            <strong style="display: block; margin-bottom: 5px;">Reason for Update:</strong>
            ${data.reason || 'Payment verification failed or blurry screenshot uploaded.'}
        `, 'danger')}
        
        <p>Please log in to the portal or visit the registration desk to re-upload your payment proof or clarify your details.</p>
        
        <div style="text-align: center;">
            <a href="https://energy.egspgroup.in/login" class="button" style="background-color: ${colors.danger};">Fix Registration</a>
        </div>
    `, `Update regarding your ${data.sportName} registration`);

    const text = `ENERGY SPORTS MEET 2026\n\nUpdate Required\n\nHi ${data.name},\nThere was an issue with your ${data.sportName} registration.\nReason: ${data.reason}\n\nPlease visit the portal for details.\nenergy.egspgroup.in`;
    return { html, text };
};

exports.getMatchScheduledTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: ${colors.brand};">New Match Scheduled! 📅</h2>
        <p>Get ready! A new match has been scheduled for <strong>${data.sportName}</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; border: 1px solid ${colors.border}; border-radius: 8px; background-color: #fafafa;">
            <div style="font-size: 18px; font-weight: bold; color: ${colors.brandDark}; margin-bottom: 10px;">
                ${data.teamAName}
            </div>
            <div style="font-size: 14px; color: ${colors.textMuted}; font-weight: bold; text-transform: uppercase;">VS</div>
            <div style="font-size: 18px; font-weight: bold; color: ${colors.brandDark}; margin-top: 10px;">
                ${data.teamBName}
            </div>
        </div>
        
        ${SectionTitle('Match Details')}
        ${InfoRow('Date & Time', data.startTime)}
        ${InfoRow('Venue', data.venue || 'Main Sports Ground')}
        
        <p style="font-size: 14px; color: ${colors.textMuted}; margin-top: 20px;">Please ensure your team reports at the venue at least 30 minutes before the start time.</p>
        
        <div style="text-align: center;">
            <a href="https://energy.egspgroup.in/matches/${data.matchId}" class="button">View Match Details</a>
        </div>
    `, `New Match: ${data.teamAName} vs ${data.teamBName}`);

    const text = `ENERGY SPORTS MEET 2026\n\nNew Match Scheduled!\n\n${data.teamAName} vs ${data.teamBName}\nSport: ${data.sportName}\nTime: ${data.startTime}\n\nView details: https://energy.egspgroup.in/matches/${data.matchId}`;
    return { html, text };
};

exports.getMatchLiveTemplate = (data) => {
    const html = baseTemplate(`
        <div style="text-align: center;">
            <h2 style="margin-top: 0; color: ${colors.danger}; text-transform: uppercase; letter-spacing: 1px;">🔴 Match is LIVE!</h2>
            <p style="font-size: 18px; color: ${colors.textMuted}; margin-bottom: 30px;">The action has begun.</p>
        </div>
        
        <div style="background-color: #fff5f5; border: 1px solid #fed7d7; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 14px; font-weight: bold; color: ${colors.danger}; text-transform: uppercase;">${data.sportName}</div>
            <div style="font-size: 22px; font-weight: 800; margin: 15px 0; color: ${colors.text};">
                ${data.teamAName} <span style="color: #ccc; margin: 0 10px;">vs</span> ${data.teamBName}
            </div>
            ${StatusBadge('Live Now', 'danger')}
        </div>
        
        <p>Stay updated with ball-by-ball commentary and real-time scores on our live dashboard.</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://energy.egspgroup.in/live" class="button" style="background-color: ${colors.danger};">Watch Live Score</a>
        </div>
    `, `Match LIVE: ${data.teamAName} vs ${data.teamBName}`);

    const text = `ENERGY SPORTS MEET 2026\n\nMATCH IS LIVE!\n\n${data.teamAName} vs ${data.teamBName} (${data.sportName})\nWatch here: https://energy.egspgroup.in/live`;
    return { html, text };
};

exports.getMatchResultTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: ${colors.brand};">Match Results are In! 🏆</h2>
        <p>The match between <strong>${data.teamAName}</strong> and <strong>${data.teamBName}</strong> has concluded.</p>
        
        ${CalloutBox(`
            <div style="text-align: center;">
                <h3 style="margin: 0; color: ${colors.success}; text-transform: uppercase; font-size: 14px;">Winner</h3>
                <div style="font-size: 24px; font-weight: 800; margin: 10px 0; color: ${colors.text};">${data.winnerName}</div>
                <div style="font-size: 16px; font-weight: bold; color: ${colors.textMuted}; border-top: 1px solid #d1e7dd; padding-top: 10px; margin-top: 10px;">
                    Score: ${data.finalScore}
                </div>
            </div>
        `, 'success')}
        
        <p>Check out the full match analysis and individual player performances on the portal.</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://energy.egspgroup.in/matches/${data.matchId}" class="button">View Highlights</a>
        </div>
    `, `Match Result: ${data.winnerName} Won!`);

    const text = `ENERGY SPORTS MEET 2026\n\nMatch Result\n\n${data.teamAName} vs ${data.teamBName}\nWinner: ${data.winnerName}\nScore: ${data.finalScore}\n\nenergy.egspgroup.in`;
    return { html, text };
};

exports.getOTPEmailTemplate = (otp) => {
    const html = baseTemplate(`
        <div style="text-align: center;">
            <h2 style="margin-top: 0; color: ${colors.brand};">Verification Code 🔐</h2>
            <p style="font-size: 16px; color: ${colors.textMuted};">Use the code below to complete your login.</p>
            
            <div style="margin: 40px auto; background-color: #f1f3f5; border: 2px dashed ${colors.brand}; border-radius: 12px; padding: 25px; display: inline-block; min-width: 200px;">
                <span style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: ${colors.brandDark}; font-family: 'Courier New', Courier, monospace; display: block;">${otp}</span>
            </div>
            
            <p style="font-size: 14px; color: ${colors.textMuted}; margin-top: 20px;">
                This code is valid for <strong>10 minutes</strong>.<br>
                If you didn't request this code, you can safely ignore this email.
            </p>
        </div>
    `, `Your Verification Code: ${otp}`);

    const text = `ENERGY SPORTS MEET 2026\n\nVerification Code: ${otp}\n\nUse this code to complete your login. Valid for 10 minutes.\n\nenergy.egspgroup.in`;
    return { html, text };
};
