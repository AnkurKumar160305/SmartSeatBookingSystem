const jwt = require('jsonwebtoken');

const user = {
    id: 'cbf6fa50-31ff-4751-b97f-17dd1552fd176',
    email: 'demo1@smartseat.com',
    name: 'John Doe',
    batch: 'Batch1',
    role: 'user',
    employee_id: 'EMP002'
};

const SECRET = 'smartseat_super_secret_key_2024';
const token = jwt.sign(user, SECRET, { expiresIn: '24h' });
console.log(token);
