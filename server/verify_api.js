const http = require('http');
const jwt = require('jsonwebtoken');

const SECRET = 'smartseat_super_secret_key_2024';
const user = {
    id: 'cbf6fa50-31ff-4751-b97f-17dd1552fd176',
    email: 'demo1@smartseat.com',
    name: 'John Doe',
    batch: 'Batch1',
    role: 'user',
    employee_id: 'EMP002'
};

const TOKEN = jwt.sign(user, SECRET, { expiresIn: '1h' });
const SEAT_ID = '0052bf65-07b5-4fe8-9f47-e5154725d176';

function post(path, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let resData = '';
            res.on('data', (chunk) => resData += chunk);
            res.on('end', () => resolve({ body: resData, status: res.statusCode }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function runTests() {
    console.log('--- TEST 1: Booking for Today (Cross-batch) ---');
    const today = new Date().toISOString().split('T')[0];
    const res1 = await post('/api/bookings', { seat_id: SEAT_ID, booking_date: today });
    console.log(`Status: ${res1.status}, Body: ${res1.body}`);

    console.log('\n--- TEST 2: Booking for tomorrow after 14 days (Should fail window check) ---');
    const future = new Date();
    future.setDate(future.getDate() + 20);
    const futDate = future.toISOString().split('T')[0];
    const res2 = await post('/api/bookings', { seat_id: SEAT_ID, booking_date: futDate });
    console.log(`Status: ${res2.status}, Body: ${res2.body}`);
}

runTests();
