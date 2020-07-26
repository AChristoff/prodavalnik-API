const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.Promise = global.Promise;
async function initializeDataBase(connectionString) {
    await mongoose.connect(connectionString, {
        useUnifiedTopology: true,
        useCreateIndex: true,
        useNewUrlParser: true,
    });

    const db = await mongoose.connection;

    db.once('open', err => {
        if (err) {
            console.log(err);
        }

        User.seedAdmin()
            .then(() => {
                console.log('Data base ready');
            }).catch((err) => {
            console.error(err);
        })
    });

    db.on('error', reason => {
        console.log(reason);
    });
}

module.exports = initializeDataBase;
