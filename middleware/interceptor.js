const postRoutes = require('../routes/postRouts');
const userRoutes = require('../routes/userRoutes');
const categoryRouts = require('../routes/categoryRouts');

module.exports = (app) => {
    app.use('/blog', postRoutes);
    app.use('/user', userRoutes);
    app.use('/category', categoryRouts);
};