const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const {connectionString, port} = require('./config/environment');
const initializeDataBase = require('./config/database');
const CORS = require('./config/cors');
const routeInterceptor = require('./middleware/interceptor');
const generalErrors = require('./util/generalErrors');
const app = express();

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

initializeDataBase(connectionString);
CORS(app);

app.use(bodyParser.json());

routeInterceptor(app);
generalErrors(app);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
    console.log(`REST API listening on port: ${port}`)
});