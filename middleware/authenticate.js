const jwt = require('jsonwebtoken');
const {jwtSecret} = require('../config/environment');

module.exports = {
    isAuth: (role) => (req, res, next) => {
        const authHeaders = req.get('Authorization');

        if (!authHeaders) {
            return res.status(401)
                .json({
                    message: 'Unauthorized!',
                    error: 'Authorization header is missing!'
                });
        }

        const decodedToken = decodeToken(req, res);
        const isAdmin = decodedToken.role === 'Admin';

        if (role && !isAdmin && decodedToken.role !== role) {

            return res.status(401)
                .json({
                    message: 'Unauthorized!',
                    error: `${role} rights are required!`
                });

        }

        req.userId = decodedToken.userId;
        req.userName = decodedToken.name;
        req.userEmail = decodedToken.email;
        req.userRole = decodedToken.role;

        next();
    },
    decodeToken
};

function decodeToken(req, res, fromParam) {

    let token;
    let decodedToken;

    if (fromParam === 'fromParam') {
        token = req.params.userToken;
    } else {
        token = req.get('Authorization').split(' ')[1];
    }


    try {
        decodedToken = jwt.verify(token, jwtSecret);
    } catch (error) {
        return res.status(401)
            .json({message: 'Invalid token!', error});
    }

    if (!decodedToken) {
        return res.status(401)
            .json({message: 'Token verification error!'});
    }

    return decodedToken;
}
