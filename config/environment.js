const environment = process.env.NODE_ENV || 'development';

const envConfig = {
    development: {
        connectionString: process.env.DB_STRING || 'mongodb://localhost:27017/rest-api-db',
        port: process.env.PORT || 3000,
        jwtSecret: process.env.JWT_SECRET || 'somesupersecret',
    },
    production: {
        connectionString: process.env.DB_STRING,
        port: process.env.PORT || 3000,
        jwtSecret: process.env.JWT_SECRET || 'somesupersecret',
    }
};

module.exports = envConfig[environment];