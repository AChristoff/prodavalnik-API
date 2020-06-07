const postRoutes = require('../routes/postRouts');
const userRoutes = require('../routes/userRoutes');

module.exports = (app) => {
    app.use('/blog', postRoutes);
    app.use('/user', userRoutes);
};