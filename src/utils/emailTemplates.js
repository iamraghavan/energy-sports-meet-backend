const brandColor = '#0056b3';
const secondaryColor = '#003d82';
const bgColor = '#f4f7f9';
const cardBg = '#ffffff';
const textColor = '#333333';
const mutedColor = '#666666';

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
        body { margin: 0; padding: 0; width: 100% !important; background-color: ${bgColor}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        .wrapper { width: 100%; table-layout: fixed; background-color: ${bgColor}; padding-bottom: 40px; }
        .main { background-color: ${cardBg}; margin: 0 auto; width: 100%; max-width: 600px; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, ${secondaryColor} 0%, ${brandColor} 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
        .content { padding: 40px 30px; line-height: 1.6; color: ${textColor}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: ${mutedColor}; }
        .button { background-color: ${brandColor}; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
        .badge { background-color: #e9ecef; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-family: monospace; color: ${secondaryColor}; }
        @media screen and (max-width: 600px) {
            .content { padding: 30px 20px !important; }
            .header { padding: 30px 15px !important; }
        }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0px; overflow: hidden;">
        ${previewText}
    </div>
    <center class="wrapper">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center" style="padding: 20px 10px;">
                    <table class="main" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <!-- HEADER -->
                        <tr>
                            <td class="header">
                                <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px; text-transform: uppercase;">Energy Sports Meet</h1>
                                <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">E.G.S. PILLAY GROUP OF INSTITUTIONS</p>
                            </td>
                        </tr>
                        <!-- CONTENT -->
                        <tr>
                            <td class="content">
                                ${content}
                            </td>
                        </tr>
                        <!-- FOOTER -->
                        <tr>
                            <td class="footer">
                                <p style="margin: 0 0 10px 0;"><strong>Energy Sports Meet 2026</strong></p>
                                <p style="margin: 0 0 15px 0;">Nagapattinam, Tamil Nadu, India</p>
                                <p style="margin: 0 0 20px 0;">
                                    <a href="https://energy.egspgroup.in" style="color: ${brandColor}; text-decoration: none;">Official Website</a> | 
                                    <a href="mailto:noreply@egsppc.ac.in" style="color: ${brandColor}; text-decoration: none;">Help Desk</a>
                                </p>
                                <div style="border-top: 1px solid #eeeeee; padding-top: 20px;">
                                    <p style="margin: 0 0 5px 0; font-size: 11px;">You are receiving this because you registered for Energy Sports Meet 2026.</p>
                                    <p style="margin: 0;">
                                        <a href="https://energy.egspgroup.in/unsubscribe?email={{EMAIL}}" style="color: ${mutedColor}; text-decoration: underline;">Unsubscribe</a> from these notifications
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
`;

exports.getRegistrationReceiptTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: ${secondaryColor};">Registration Acknowledged!</h2>
        <p>Hi <strong>${data.name}</strong>,</p>
        <p>Thank you for signing up for the <strong>Energy Sports Meet 2026</strong>! We have received your application for <strong>${data.sportName}</strong>.</p>
        
        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding-bottom: 10px; font-size: 14px; color: ${mutedColor};">Registration Code</td>
                    <td style="padding-bottom: 10px; font-weight: bold; text-align: right;">${data.regCode}</td>
                </tr>
                <tr>
                    <td style="padding-bottom: 10px; font-size: 14px; color: ${mutedColor};">Sport Event</td>
                    <td style="padding-bottom: 10px; font-weight: bold; text-align: right;">${data.sportName}</td>
                </tr>
                <tr>
                    <td>Status</td>
                    <td style="text-align: right;"><span style="color: #f39c12; font-weight: bold;">PENDING VERIFICATION</span></td>
                </tr>
            </table>
        </div>
        
        <p>Our committee is currently reviewing your payment screenshot. You'll receive a confirmation email once your entry is approved.</p>
        
        <p style="margin-top: 30px; font-size: 14px;">Good luck with your preparation!</p>
    `, `Registration Received for ${data.sportName}`);

    const text = `ENERGY SPORTS MEET 2026\n\nRegistration Received!\n\nHi ${data.name},\nWe've received your application for ${data.sportName}.\nReg Code: ${data.regCode}\nStatus: Pending Verification\n\nWe'll notify you once approved.\nenergy.egspgroup.in`;
    return { html, text };
};

exports.getRegistrationApprovalTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: #28a745;">Registration Confirmed!</h2>
        <p>Congratulations <strong>${data.name}</strong>!</p>
        <p>Your entry for the <strong>Energy Sports Meet 2026</strong> has been officially <strong>APPROVED</strong>.</p>
        
        <div style="background-color: #e8f5e9; border: 1px solid #c8e6c9; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0; color: #2e7d32; font-size: 14px;"><strong>Your Ticket is Attached!</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Please find your official <strong>Entry Pass (PDF)</strong> attached to this email.</p>
        </div>
        
        <div style="margin: 25px 0;">
            <h3 style="font-size: 16px; margin-bottom: 10px;">Reporting Instructions:</h3>
            <ul style="padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;">Keep the digital or printed copy of the ticket ready.</li>
                <li style="margin-bottom: 8px;">Bring your original <strong>College ID Card</strong>.</li>
                <li style="margin-bottom: 8px;">Report 45 minutes before the event start time.</li>
            </ul>
        </div>
        
        <p>Best of luck for the competition!</p>
    `, `Confirmed! Your ${data.sportName} ticket is ready.`);

    const text = `ENERGY SPORTS MEET 2026\n\nCONFIRMED!\n\nHi ${data.name},\nYour registration for ${data.sportName} is approved. Your Ticket PDF is attached.\n\nReg Code: ${data.regCode}\n\nenergy.egspgroup.in`;
    return { html, text };
};

exports.getRegistrationRejectionTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: #dc3545;">Action Required: Registration Update</h2>
        <p>Hi <strong>${data.name}</strong>,</p>
        <p>We encountered an issue while verifying your registration for <strong>${data.sportName}</strong>.</p>
        
        <div style="background-color: #fff5f5; border: 1px solid #fed7d7; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0; color: #c53030; font-weight: bold;">Reason for Update:</p>
            <p style="margin: 10px 0 0 0;">${data.reason || 'Payment verification failed or blurry screenshot uploaded.'}</p>
        </div>
        
        <p><strong>Next Steps:</strong></p>
        <p>Please log in to the portal or visit the registration desk to re-upload your payment proof or clarify your details.</p>
        
        <p>We apologize for any inconvenience caused.</p>
    `, `Update regarding your ${data.sportName} registration`);

    const text = `ENERGY SPORTS MEET 2026\n\nUpdate Required\n\nHi ${data.name},\nThere was an issue with your ${data.sportName} registration.\nReason: ${data.reason}\n\nPlease visit the portal for details.\nenergy.egspgroup.in`;
    return { html, text };
};

exports.getMatchScheduledTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: ${brandColor};">New Match Scheduled!</h2>
        <p>Get ready! A new match has been scheduled for <strong>${data.sportName}</strong>.</p>
        
        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center;">
            <p style="font-size: 20px; font-weight: bold; margin: 0; color: ${secondaryColor};">
                ${data.teamAName} vs ${data.teamBName}
            </p>
            <hr style="border: 0; border-top: 1px solid #dee2e6; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${data.startTime}</p>
            <p style="margin: 5px 0;"><strong>Venue:</strong> ${data.venue || 'Main Sports Ground'}</p>
        </div>
        
        <p>Please ensure your team reports at the venue at least 30 minutes before the start time. Check the live dashboard for any schedule changes.</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://energy.egspgroup.in/matches/${data.matchId}" class="button">View Match Details</a>
        </div>
    `, `New Match: ${data.teamAName} vs ${data.teamBName}`);

    const text = `ENERGY SPORTS MEET 2026\n\nNew Match Scheduled!\n\n${data.teamAName} vs ${data.teamBName}\nSport: ${data.sportName}\nTime: ${data.startTime}\n\nView details: https://energy.egspgroup.in/matches/${data.matchId}`;
    return { html, text };
};

exports.getMatchLiveTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: #dc3545;">Match is LIVE! 🔴</h2>
        <p>The match between <strong>${data.teamAName}</strong> and <strong>${data.teamBName}</strong> has just started!</p>
        
        <div style="background-color: #fffaf0; border: 1px solid #feebc8; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="font-size: 14px; text-transform: uppercase; color: #dd6b20; font-weight: bold; margin-bottom: 5px;">Live Broadcast</p>
            <p style="font-size: 22px; font-weight: bold; margin: 10px 0;">${data.sportName}</p>
            <p style="font-size: 18px; margin: 0;">${data.teamAName} <span style="color: #cbd5e0;">vs</span> ${data.teamBName}</p>
        </div>
        
        <p>Stay updated with ball-by-ball commentary and real-time scores on our live dashboard.</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://energy.egspgroup.in/live" class="button" style="background-color: #dc3545;">Watch Live Score</a>
        </div>
    `, `Match LIVE: ${data.teamAName} vs ${data.teamBName}`);

    const text = `ENERGY SPORTS MEET 2026\n\nMATCH IS LIVE!\n\n${data.teamAName} vs ${data.teamBName} (${data.sportName})\nWatch here: https://energy.egspgroup.in/live`;
    return { html, text };
};

exports.getMatchResultTemplate = (data) => {
    const html = baseTemplate(`
        <h2 style="margin-top: 0; color: ${brandColor};">Match Results are In!</h2>
        <p>The match between <strong>${data.teamAName}</strong> and <strong>${data.teamBName}</strong> has concluded.</p>
        
        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="font-size: 14px; text-transform: uppercase; color: ${secondaryColor}; font-weight: bold; margin-bottom: 5px;">Final Score</p>
            <p style="font-size: 24px; font-weight: bold; margin: 10px 0; color: #1e293b;">${data.finalScore}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
            <p style="font-size: 20px; font-weight: bold; margin: 0; color: #059669;">🏆 Winner: ${data.winnerName}</p>
        </div>
        
        <p>Check out the full match analysis and individual player performances on the portal.</p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://energy.egspgroup.in/matches/${data.matchId}" class="button">View Highlights</a>
        </div>
    `, `Match Result: ${data.winnerName} Won!`);

    const text = `ENERGY SPORTS MEET 2026\n\nMatch Result\n\n${data.teamAName} vs ${data.teamBName}\nWinner: ${data.winnerName}\nScore: ${data.finalScore}\n\nenergy.egspgroup.in`;
    return { html, text };
};
