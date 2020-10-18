const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.Promise = global.Promise;
async function initializeDataBase(connectionString) {
    mongoose.connect(connectionString, {
        useUnifiedTopology: true,
        useCreateIndex: true,
        useNewUrlParser: true,
    });

    const db = mongoose.connection;
    
    db.once('open', err => {
        if (err) {
            console.log(err);
        }
        
        User.seedAdmin()
            .then(() => {
                console.log('Admin seeded!');
            }).catch((err) => {
            console.error(err);
        })
    });

    db.on('error', reason => {
        console.log(reason);
    });
}

module.exports = initializeDataBase;
