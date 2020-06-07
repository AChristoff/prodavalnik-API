const crypto = require('crypto');

module.exports = {
    generateSalt: () => {
        return crypto.randomBytes(128).toString('base64')
    },
    generateHashedPassword: (salt, password) => {
        return crypto.createHmac('sha256', salt).update(password).digest('hex')
    },
    generateDefaultPassword: () => {
        return crypto.randomBytes(32).toString('hex');
    }
};
