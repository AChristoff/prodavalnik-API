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

app.use(bodyParser.json({limit: '2mb'}));

routeInterceptor(app);
generalErrors(app);

// allow access to public files
app.use('/public', express.static(process.cwd() + '/public'))

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// redirect 404 to /api/docs
app.get('*', function(req, res) {
    res.redirect('/api/docs');
});


app.listen(port, () => {
    console.log(`REST API listening on port: ${port}`)
});