const environment = process.env.NODE_ENV || 'development';

const envConfig = {
    development: {
        connectionString: process.env.DB_STRING,
        port: process.env.PORT,
        jwtSecret: process.env.JWT_SECRET,
    },
    production: {
        connectionString: process.env.DB_STRING,
        port: process.env.PORT,
        jwtSecret: process.env.JWT_SECRET,
    }
};

module.exports = envConfig[environment];