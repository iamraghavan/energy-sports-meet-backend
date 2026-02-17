require('dotenv').config();
const { sequelize, User, Sport } = require('../src/models');
const { sendEmail } = require('../src/utils/email');

const usersToSeed = [
    { name: "ASWINDOSS J", mobile: "7010484757", email: "aswindossaswin123@gmail.com", sport: "Kabaddi", password: "asw4757@Ka" },
    { name: "Saransankar", mobile: "7708501438", email: "Mail2saran0713@gmail.com", sport: "Overall", password: "sar1438@Ov" },
    { name: "Girimurugan", mobile: "7845578447", email: "girimurugan2005@gmail.com", sport: "Overall", password: "gir8447@Ov" },
    { name: "Gunalan", mobile: "9344653022", email: "gunalanmuthu.ms@gmail.com", sport: "Kabaddi", password: "gun3022@Ka" },
    { name: "Abishek", mobile: "7010171988", email: "labishek1145@gmail.com", sport: "Volleyball", password: "abi1988@Vo" },
    { name: "Aravindhan", mobile: "9025814188", email: "aravindramesh845@gmail.com", sport: "Volleyball", password: "ara4188@Vo" },
    { name: "Balaprasanna", mobile: "9786664642", email: "balaprasanna245@gmail.com", sport: "Cricket", password: "bal4642@Cr" },
    { name: "Shiyam Ganesh", mobile: "9025092446", email: "Shiyam99krishna@gmail.com", sport: "Cricket", password: "shi2446@Cr" },
    { name: "Abinesh", mobile: "8428691926", email: "abineshabijothibasu@gmail.com", sport: "Kabaddi", password: "abi1926@Ka" },
    { name: "PARTHASARATHY P", mobile: "9698137260", email: "parthypalani2005@gmail.com", sport: "Cricket", password: "par7260@Cr" },
    { name: "Ansen Vilbert", mobile: "7358959448", email: "stespenansen@gmail.com", sport: "Football", password: "ans9448@Fo" },
    { name: "Sriram", mobile: "8015516223", email: "srirambrabou2006@gmail.com", sport: "Table Tennis", password: "sri6223@Ta" },
    { name: "Yadheswar", mobile: "9962056366", email: "yadhescenzo@gmail.com", sport: "Chess", password: "yad6366@Ch" },
    { name: "Shiyam Sundar", mobile: "9443951403", email: "shiyam.sundar.3004@gmail.com", sport: "Badminton", password: "shi1403@Ba" },
    { name: "Faris Shaukath", mobile: "9894966207", email: "Hurryup00456@gmail.com", sport: "Chess", password: "far6207@Ch" },
    { name: "Kaveyan S", mobile: "9944218605", email: "kaveyankaveyan7@gmail.com", sport: "Football", password: "kav8605@Fo" },
    { name: "Ajim Farvase", mobile: "8838800226", email: "afarvase@gmail.com", sport: "Cricket", password: "aji0226@Cr" }
];

async function seedSportsHeads() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        // Fetch all sports to map names to IDs
        const allSports = await Sport.findAll();
        console.log(`ℹ️ Found ${allSports.length} sports in DB.`);

        for (const user of usersToSeed) {
            
            let sportId = null;
            if (user.sport !== 'Overall') {
                // Find the sport (case-insensitive search if needed, but db names are likely proper cased)
                const sportObj = allSports.find(s => s.name.toLowerCase() === user.sport.toLowerCase());
                if (sportObj) {
                    sportId = sportObj.id;
                } else {
                    console.warn(`⚠️ Sport '${user.sport}' not found for user ${user.name}. Skipping assignment.`);
                }
            }

            // Check if user exists
            const existingUser = await User.findOne({ where: { email: user.email } });
            
            if (existingUser) {
                console.log(`ℹ️ User ${user.name} (${user.email}) already exists. Skipping creation.`);
                // Ideally, we could update the role or password, but preventing destructiveness as requested.
                // We will still send the email though, as requested "sent a mail... to check".
            } else {
                // Create User
                // Username strategy: use email or a derived handle?
                // Model requires unique username. Let's use the email prefix or full email.
                // Or maybe the user provided "Password" looks like it has a pattern?
                // Let's use email as username for simplicity and uniqueness.
                
                await User.create({
                    name: user.name,
                    email: user.email,
                    username: user.email, // Using email as username
                    password: user.password, // Hook will hash it
                    role: 'sports_head',
                    assigned_sport_id: sportId,
                    is_active: true
                });
                console.log(`✅ Created User: ${user.name} [${user.sport}]`);
            }

            // Send Email
            try {
                const emailContent = `
                    <h3>Welcome to Energy Sports Meet 2026 Admin Portal</h3>
                    <p>Dear ${user.name},</p>
                    <p>You have been added as a <strong>Sports Head</strong> for <strong>${user.sport}</strong>.</p>
                    <p>Here are your login credentials:</p>
                    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Role</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">Sports Head (${user.sport})</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Username / Email</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>WhatsApp Number</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.mobile}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Password</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${user.password}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px;">
                        <a href="https://energy.egspgroup.in/auth/session" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
                    </p>
                    <p>If the button doesn't work, copy and paste this link:</p>
                    <p><a href="https://energy.egspgroup.in/auth/session">https://energy.egspgroup.in/auth/session</a></p>
                    <p>Best Regards,<br>Energy Sports Committee</p>
                `;

                await sendEmail({
                    to: user.email,
                    subject: 'Your Sports Head Login Credentials - Energy Sports Meet 2026',
                    html: emailContent,
                    text: `Hello ${user.name}, Your login credentials: Email: ${user.email}, Password: ${user.password}. Login at https://energy.egspgroup.in/auth/session`
                });
                console.log(`📧 Email sent to ${user.email}`);

            } catch (emailErr) {
                console.error(`❌ Failed to send email to ${user.email}:`, emailErr.message);
            }
            
            // Introduce a small delay to avoid hitting email rate limits if any
            await new Promise(resolve => setTimeout(resolve, 500)); 
        }

        console.log('--- Seeding Completed ---');
        await sequelize.close();

    } catch (error) {
        console.error('❌ Seeding Error:', error);
    }
}

seedSportsHeads();
