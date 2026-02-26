const express = require('express');
const { db } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Comprehensive GenAI-style rule engine for SmartSeat business queries
function buildContext(user) {
    const buffers = db.prepare('SELECT * FROM buffer_seats').all();
    const holidays = db.prepare('SELECT * FROM holidays ORDER BY date').all();
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = db.prepare(
        "SELECT COUNT(*) as count FROM bookings WHERE booking_date = ? AND status = 'active' AND payment_status = 'paid'"
    ).get(today);
    const userBookings = db.prepare(
        "SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status = 'active' AND payment_status = 'paid'"
    ).get(user.id);
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get();

    return { buffers, holidays, today, todayBookings, userBookings, totalUsers };
}

function getSmartResponse(msg, user, context) {
    const lower = msg.toLowerCase().trim();
    const userBatch = user.batch;
    const batchDays = userBatch === 'Batch1' ? 'Monday, Tuesday, Wednesday' : 'Thursday, Friday';
    const otherBatch = userBatch === 'Batch1' ? 'Batch2' : 'Batch1';
    const otherDays = userBatch === 'Batch1' ? 'Thursday, Friday' : 'Monday, Tuesday, Wednesday';
    const myBuffer = context.buffers.find(b => b.batch === userBatch);
    const otherBuffer = context.buffers.find(b => b.batch === otherBatch);

    // ============ GREETINGS ============
    if (lower.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy|sup|yo)/)) {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        return `${greeting}, ${user.name}! 👋\n\nI'm your SmartSeat AI Assistant. I can help you with:\n\n🪑 **Seat booking & availability**\n📋 **Booking rules & policies**\n🔁 **Cross-batch eligibility**\n💳 **Payment & billing**\n🔓 **Cancellations & refunds**\n🟡 **Buffer seat status**\n📅 **Holidays & schedule**\n📊 **Workspace statistics**\n\nJust ask me anything about workspace booking!`;
    }

    // ============ THANK YOU ============
    if (lower.match(/^(thanks|thank you|thx|ty|appreciate|great|awesome|perfect|wonderful)/)) {
        return `You're welcome, ${user.name}! 😊 Happy to help. If you have any other questions about workspace booking, feel free to ask anytime!`;
    }

    // ============ BOOKING RULES ============
    if (lower.match(/booking rule|how.*book|booking polic|can i book|what are the rules|how does booking work|how do i book|book.*seat/)) {
        return `📋 **SmartSeat Booking Rules**\n\n**Your Profile:** ${userBatch} member\n**Your Days:** ${batchDays}\n\n**📌 Same-Batch Booking:**\n• Book seats on your batch days (${batchDays})\n• Window: Up to **14 days** in advance\n• Payment required to confirm\n\n**🔁 Cross-Batch Booking:**
• Book on other batch's days (${otherDays})
• ⚠️ Only allowed for **today or tomorrow**
• ⚠️ If tomorrow, only after **3:00 PM**
• Uses buffer seats (currently: ${otherBuffer?.total_buffer || 0} available)
\n\n**🚫 Restrictions:**\n• No weekend bookings (Sat/Sun)\n• No bookings on holidays\n• One seat per day per user\n• Payment must succeed to confirm\n\n💡 Head to the **Seat Map** to start booking!`;
    }

    // ============ SPECIFIC DAY QUERIES ============
    if (lower.match(/can i.*book.*(monday|tuesday|wednesday)/i) || lower.match(/^(monday|tuesday|wednesday)$/)) {
        const day = lower.match(/(monday|tuesday|wednesday)/i)?.[1];
        if (userBatch === 'Batch1') {
            return `✅ **Yes, ${day?.charAt(0).toUpperCase() + day?.slice(1)} is a ${userBatch} day!**\n\nAs a Batch1 member, you can book freely on Mon/Tue/Wed.\n\n**Booking window:** Up to 14 days in advance\n**Buffer status:** ${myBuffer?.total_buffer || 0} seats available\n\n💡 Go to **Seat Map** → Select ${day} → Pick your seat → Pay → Done!`;
        } else {
            return `⚠️ **${day?.charAt(0).toUpperCase() + day?.slice(1)} is a Batch1 day.**\n\nAs a **${userBatch}** member, this would be a **cross-batch booking**.\n\n**Requirements:**\n• 📅 Book for **today or tomorrow**
• ⏰ If for tomorrow, must be **after 3:00 PM**
\n• 🟡 Buffer seats available: **${otherBuffer?.total_buffer || 0}**\n• 💳 Payment must be completed\n• 🚫 Date must not be a holiday\n\n${new Date().getHours() >= 15 ? '✅ It\'s currently after 3 PM, so cross-batch booking may be possible!' : '❌ It\'s currently before 3 PM. Cross-batch booking opens after 3:00 PM.'}`;
        }
    }

    if (lower.match(/can i.*book.*(thursday|friday)/i) || lower.match(/^(thursday|friday)$/)) {
        const day = lower.match(/(thursday|friday)/i)?.[1];
        if (userBatch === 'Batch2') {
            return `✅ **Yes, ${day?.charAt(0).toUpperCase() + day?.slice(1)} is a ${userBatch} day!**\n\nAs a Batch2 member, you can book freely on Thu/Fri.\n\n**Booking window:** Up to 14 days in advance\n**Buffer status:** ${myBuffer?.total_buffer || 0} seats available\n\n💡 Go to **Seat Map** → Select ${day} → Pick your seat → Pay → Done!`;
        } else {
            return `⚠️ **${day?.charAt(0).toUpperCase() + day?.slice(1)} is a Batch2 day.**\n\nAs a **${userBatch}** member, this would be a **cross-batch booking**.\n\n**Requirements:**\n• 📅 Book for **today or tomorrow**
• ⏰ If for tomorrow, must be **after 3:00 PM**
\n• 🟡 Buffer seats available: **${otherBuffer?.total_buffer || 0}**\n• 💳 Payment must be completed\n• 🚫 Date must not be a holiday\n\n${new Date().getHours() >= 15 ? '✅ It\'s currently after 3 PM, so cross-batch booking may be possible!' : '❌ It\'s currently before 3 PM. Cross-batch booking opens after 3:00 PM.'}`;
        }
    }

    if (lower.match(/saturday|sunday|weekend/)) {
        return `🚫 **Weekends are closed.**\n\nThe workspace operates **Monday through Friday** only.\n• Batch1: Mon, Tue, Wed\n• Batch2: Thu, Fri\n\nNo bookings are available on Saturday or Sunday.`;
    }

    // ============ TODAY / TOMORROW ============
    if (lower.match(/today|right now|this moment/)) {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
        const isWeekend = ['Saturday', 'Sunday'].includes(dayName);
        const dayBatch = ['Monday', 'Tuesday', 'Wednesday'].includes(dayName) ? 'Batch1' : 'Batch2';

        if (isWeekend) {
            return `📅 **Today is ${dayName}** — the workspace is closed on weekends.\n\nNext available day: **Monday** (Batch1 day)`;
        }

        return `📅 **Today is ${dayName}** (${dayBatch} day)\n\n📊 **Today's Stats:**\n• Seats booked today: **${context.todayBookings?.count || 0}**/80\n• Available: **${80 - (context.todayBookings?.count || 0)}**\n\n${userBatch === dayBatch ? '✅ This is your batch day! You can book.' : `⚠️ This is a ${dayBatch} day. Cross-batch rules apply for you.`}\n\n🟡 Buffer: ${myBuffer?.total_buffer || 0} seats`;
    }

    if (lower.match(/tomorrow|next day|tmrw/)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][tomorrow.getDay()];
        const isWeekend = ['Saturday', 'Sunday'].includes(dayName);
        const dayBatch = ['Monday', 'Tuesday', 'Wednesday'].includes(dayName) ? 'Batch1' : 'Batch2';

        if (isWeekend) {
            return `📅 **Tomorrow is ${dayName}** — the workspace is closed on weekends.`;
        }

        const isCross = userBatch !== dayBatch;
        return `📅 **Tomorrow is ${dayName}** (${dayBatch} day)\n\n${isCross
            ? `⚠️ This is a cross-batch booking for you.\n• Must book **today after 3 PM**\n• ${new Date().getHours() >= 15 ? '✅ It\'s after 3 PM — you can book now!' : '⏰ Wait until 3 PM to book.'}\n• Buffer available: ${otherBuffer?.total_buffer || 0}`
            : `✅ This is your batch day! You can book up to 14 days in advance.`}`;
    }

    // ============ CROSS-BATCH ============
    if (lower.match(/cross.?batch|other batch|different batch|outside.*batch|book.*other/)) {
        return `🔁 **Cross-Batch Booking Policy**\n\nYour batch: **${userBatch}** (${batchDays})\n\nTo book on **${otherDays}** (${otherBatch} days):\n\n**✅ ALL conditions must be met:**\n1. 📅 Booking must be for **today or tomorrow**
2. ⏰ If for tomorrow, must be **after 3:00 PM**
\n3. 🟡 Buffer seats must be available (currently: **${otherBuffer?.total_buffer || 0}**)\n4. 🚫 Date must **not** be a holiday\n5. 💳 Payment must be **completed**\n\n**❌ Not allowed if:**\n• More than 1 day before → ❌\n• Same day booking → ❌\n• Before 3:00 PM → ❌\n• Holiday → ❌\n• Buffer exhausted → ❌\n\n**Example:**\nTo book ${otherBatch === 'Batch1' ? 'Monday' : 'Thursday'}:\n→ Book on ${otherBatch === 'Batch1' ? 'Sunday' : 'Wednesday'} after 3 PM`;
    }

    // ============ AVAILABILITY ============
    if (lower.match(/availab|free seat|how many seat|seat.*left|any seat|open seat|vacant/)) {
        const available = 80 - (context.todayBookings?.count || 0);
        return `📊 **Seat Availability Overview**\n\n**Total Infrastructure:**\n• 🪑 **80 seats** across 10 spots\n• 📍 Spots 1-5: Batch1 (40 seats)\n• 📍 Spots 6-10: Batch2 (40 seats)\n\n**Today:**\n• Booked: **${context.todayBookings?.count || 0}**\n• Available: **${available}**\n\n**🟡 Buffer Status:**\n• Batch1: **${context.buffers.find(b => b.batch === 'Batch1')?.total_buffer || 0}** buffer seats\n• Batch2: **${context.buffers.find(b => b.batch === 'Batch2')?.total_buffer || 0}** buffer seats\n\n💡 For detailed availability on a specific date, visit the **Seat Map** page!`;
    }

    // ============ BUFFER ============
    if (lower.match(/buffer|extra seat|overflow|buffer.*seat|how.*buffer/)) {
        return `🟡 **Buffer Seat System**\n\n**Current Status:**\n• Batch1 Buffer: **${context.buffers.find(b => b.batch === 'Batch1')?.total_buffer || 0}** seats\n• Batch2 Buffer: **${context.buffers.find(b => b.batch === 'Batch2')?.total_buffer || 0}** seats\n\n**How Buffer Works:**\n1. Each batch starts with **10 buffer seats**\n2. Buffer is **dynamic** — it grows!\n3. When someone **cancels**, buffer increases by +1\n4. Cross-batch bookings **use** buffer seats\n5. Admin can manually adjust buffer counts\n\n**Example:**\n• Initial buffer = 10\n• User cancels booking → buffer = **11**\n• Cross-batch booking → buffer = **10** again`;
    }

    // ============ PAYMENT ============
    if (lower.match(/pay|razorpay|cost|price|fee|charge|billing|invoice|how much|₹|rupee|inr/)) {
        return `💳 **Payment Information**\n\n**Booking Fee:** ₹100 per seat per day\n**Payment Gateway:** Razorpay (Secure)\n\n**Payment Flow:**\n1. 🪑 Select your seat on the Seat Map\n2. 💳 Click to book → Payment modal appears\n3. ✅ Complete payment → Booking confirmed!\n4. ❌ Payment fails → Seat auto-released\n\n**⏱️ Payment Timeout:** 5 minutes\nIf you don't complete payment within 5 minutes, the seat is automatically released.\n\n**Refund Policy:**\nWhen you cancel a booking, the refund is processed automatically.\n\n🔒 All transactions are secured by Razorpay.`;
    }

    // ============ CANCEL / RELEASE ============
    if (lower.match(/cancel|release|refund|can't attend|cannot attend|modify|change|reschedule|won't come/)) {
        return `🔓 **Cancellation & Release Policy**\n\n**How to Cancel:**\n1. Go to your **Dashboard**\n2. Find the booking in **Booking History**\n3. Click the **Cancel** button\n4. Confirm cancellation\n\n**What Happens:**\n• ✅ Seat becomes available immediately\n• 🟡 Buffer count increases by +1\n• 💰 Refund is processed automatically\n\n**Can I reschedule?**\nThere's no direct reschedule. Cancel your current booking and create a new one.\n\n**Your Active Bookings:** ${context.userBookings?.count || 0}`;
    }

    // ============ HOLIDAYS ============
    if (lower.match(/holiday|leave|closed|off day|public holiday|company holiday|will it be open/)) {
        const upcoming = context.holidays.filter(h => h.date >= context.today);
        return `🎉 **Holidays & Closures**\n\n**Policy:** No bookings allowed on holidays. If a holiday is added after you book, your booking is automatically cancelled.\n\n**${upcoming.length > 0 ? 'Upcoming' : 'Scheduled'} Holidays:**\n${upcoming.length > 0
            ? upcoming.map(h => `• **${h.date}** — ${h.reason}`).join('\n')
            : context.holidays.length > 0
                ? context.holidays.slice(-5).map(h => `• **${h.date}** — ${h.reason}`).join('\n')
                : '• No holidays currently scheduled'}\n\n💡 Admins can add/remove holidays from the Admin Panel.`;
    }

    // ============ MY BATCH / PROFILE ============
    if (lower.match(/my batch|which batch|batch info|batch detail|my profile|my account|my info|who am i/)) {
        const spots = userBatch === 'Batch1' ? '1-5' : '6-10';
        return `👤 **Your Profile**\n\n• **Name:** ${user.name}\n• **Email:** ${user.email}\n• **Batch:** ${userBatch}\n• **Employee ID:** ${user.employee_id || 'N/A'}\n• **Role:** ${user.role}\n\n**Batch Details:**\n• 📅 Your days: **${batchDays}**\n• 📍 Your spots: **Spot ${spots}**\n• 🪑 Seats per spot: **8**\n• 🟡 Total seats: **40**\n• 🟡 Buffer available: **${myBuffer?.total_buffer || 0}**\n\n📊 Your active bookings: **${context.userBookings?.count || 0}**`;
    }

    // ============ WORKSPACE / INFRASTRUCTURE ============
    if (lower.match(/workspace|infrastructure|layout|capacity|total|how many spot|how many seat|office/)) {
        return `🏢 **Workspace Infrastructure**\n\n**Physical Layout:**\n• 📍 **10 Spots** total\n• 🪑 **8 Seats** per spot\n• 🏢 **80 Seats** total capacity\n\n**Batch Allocation:**\n\n| Batch | Spots | Seats | Days |\n|-------|-------|-------|------|\n| Batch1 | 1-5 | 40 | Mon-Wed |\n| Batch2 | 6-10 | 40 | Thu-Fri |\n\n**Color Coding:**\n• 🟢 Green = Available\n• 🔴 Red = Booked\n• 🟡 Yellow = Buffer/Cross-batch\n\n**Total Users:** ${context.totalUsers?.count || 0}`;
    }

    // ============ BOOKING WINDOW ============
    if (lower.match(/how (far|early|long|many days).*advance|booking window|14 day|advance booking|book.*advance/)) {
        return `📅 **Booking Window**\n\n**Same-Batch:**\n• You can book up to **14 days** in advance\n• Example: On Feb 1, you can book up to Feb 15\n\n**Cross-Batch:**\n• Only **today or tomorrow** (1 day before after 3 PM)
\n• After **3:00 PM** on the day before\n\n**Cannot book:**\n• Past dates\n• Weekends (Sat/Sun)\n• Holidays\n• More than 14 days ahead`;
    }

    // ============ SPOTS ============
    if (lower.match(/spot|where.*sit|which spot|location|area|zone/)) {
        const mySpots = userBatch === 'Batch1' ? 'Spots 1-5' : 'Spots 6-10';
        return `📍 **Spot Information**\n\nYour assigned spots: **${mySpots}**\nEach spot has **8 seats**\n\n**Layout:**\n• Spots 1-5: Batch1 area\n• Spots 6-10: Batch2 area\n\n💡 You can book any seat within any spot on your batch days. For cross-batch booking, you can book seats in the other batch's spots (using buffer seats).`;
    }

    // ============ ADMIN / REPORTS ============
    if (lower.match(/admin|report|analytics|statistic|usage|utilization|dashboard/)) {
        if (user.role === 'admin') {
            return `⚙️ **Admin Panel Features**\n\n• **📊 Analytics** — Seat utilization, heatmap, booking trends\n• **📋 All Bookings** — View/manage all user bookings\n• **🎉 Holidays** — Add/remove holidays\n• **🟡 Buffer** — Adjust buffer counts per batch\n• **🔓 Force Release** — Cancel any booking\n\n💡 Access the Admin Panel from the navbar!`;
        }
        return `📊 For analytics and reports, please contact your workspace admin. As a ${user.role}, you can view your own booking history on the Dashboard.`;
    }

    // ============ DUPLICATE BOOKING ============
    if (lower.match(/two seat|multiple seat|book twice|double book|duplicate|same day.*two|can i book 2/)) {
        return `🚫 **One Seat Per Day Policy**\n\nEach user can only book **one seat per day**.\n\n• ❌ Two seats on the same date → Not allowed\n• ❌ Booking the same seat twice → Prevented\n• ✅ One seat per day → Allowed\n• ✅ Different seats on different days → Allowed\n\nIf you need to change your seat, cancel the existing booking first, then book a new one.`;
    }

    // ============ PROBLEMS / ISSUES ============
    if (lower.match(/problem|issue|error|not working|bug|can't|cannot|stuck|fail|trouble|help me/)) {
        return `🔧 **Troubleshooting Help**\n\nCommon issues and solutions:\n\n**"Cannot book" error:**\n• Check if it's a holiday\n• Verify it's within the 14-day window\n• Cross-batch? Must be after 3 PM, 1 day before\n• Already booked for that date? Cancel first\n\n**Payment failed:**\n• Retry the payment\n• Seat is auto-released on failure\n• Try a different payment method\n\n**Seat shows as booked:**\n• Someone else may have booked it\n• Try selecting a different seat\n\n**Still having issues?**\nContact admin@smartseat.com for support.`;
    }

    // ============ TIME / 3 PM ============
    if (lower.match(/3.*pm|3:00|three pm|what time|when.*cross|time restriction|after 3/)) {
        const now = new Date();
        const isPast3 = now.getHours() >= 15;
        return `⏰ **3:00 PM Cross-Batch Rule**\n\nCross-batch bookings are only allowed **after 3:00 PM** on the day before the meeting.\n\n**Current time:** ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n**Status:** ${isPast3 ? '✅ Cross-batch booking is **OPEN**' : '❌ Cross-batch booking is **NOT yet available**. Opens at 3:00 PM.'}\n\n**Why 3 PM?**\nThis gives same-batch users priority to book their seats during working hours. Cross-batch users get access to remaining seats in the evening.`;
    }

    // ============ HELP ============
    if (lower.match(/help|what can you|support|assist|menu|options|commands|what do you do/)) {
        return `🤖 **SmartSeat AI Assistant**\n\nI can answer all your workspace booking questions! Try asking:\n\n📋 **"What are the booking rules?"** — Complete policy\n📊 **"Show me availability"** — Current seat status\n🔁 **"How does cross-batch work?"** — Cross-batch policy\n💳 **"How do I pay?"** — Payment info\n🔓 **"How do I cancel?"** — Cancellation policy\n🟡 **"Buffer status"** — Buffer seat info\n📅 **"Show holidays"** — Holiday calendar\n👤 **"My profile"** — Your batch info\n🏢 **"Workspace layout"** — Infrastructure details\n\n**Or ask about specific days:**\n• "Can I book for Thursday?"\n• "What about tomorrow?"\n• "Is today a holiday?"`;
    }

    // ============ COMPARISON ============
    if (lower.match(/batch1.*batch2|batch2.*batch1|difference.*batch|compare.*batch/)) {
        return `🔄 **Batch Comparison**\n\n| Feature | Batch1 | Batch2 |\n|---------|--------|--------|\n| Days | Mon-Wed | Thu-Fri |\n| Spots | 1-5 | 6-10 |\n| Seats | 40 | 40 |\n| Buffer | ${context.buffers.find(b => b.batch === 'Batch1')?.total_buffer || 0} | ${context.buffers.find(b => b.batch === 'Batch2')?.total_buffer || 0} |\n\nBoth batches share the same booking rules. Cross-batch booking follows the 1-day + 3PM rule.`;
    }

    // ============ GENERIC / FALLBACK ============
    return `🤔 I'm not sure about "${msg}". I can help with:\n\n• 📋 **"booking rules"** — How booking works\n• 📊 **"availability"** — Check seat availability\n• 🔁 **"cross-batch"** — Cross-batch eligibility\n• 💳 **"payment"** — Payment information\n• 🔓 **"cancel"** — Cancellation policy\n• 🟡 **"buffer"** — Buffer seat status\n• 📅 **"holidays"** — Holiday calendar\n• 👤 **"my batch"** — Your profile info\n• 🏢 **"workspace"** — Infrastructure details\n• ⏰ **"3 PM rule"** — Cross-batch timing\n\n💡 Or ask about a specific day like **"Can I book Thursday?"**`;
}

router.post('/', authenticateToken, (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const context = buildContext(req.user);
        const reply = getSmartResponse(message, req.user, context);

        res.json({ reply });
    } catch (err) {
        console.error('Chatbot error:', err);
        res.status(500).json({ error: 'Chatbot failed to respond' });
    }
});

module.exports = router;
