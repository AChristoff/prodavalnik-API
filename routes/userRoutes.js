const router = require('express').Router();
const userController = require('../controllers/userController');
const {body} = require('express-validator');
const restrictedPages = require('../middleware/authenticate');
const {sanitizeEmail, sanitizePassword, sanitizeName} = require('../middleware/sanitazie');


router.post('/register',
    [
        sanitizeEmail('email', 'required'),
    ],
    userController.register
);

router.put('/register/confirm/:userToken',
    [
        sanitizePassword('password', 'required'),
        sanitizeName('name', 'required')
    ],
    userController.registerConfirm
);

router.post('/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email!'),
        sanitizePassword('password', 'required')
    ],
    userController.login);


router.get('/profile', restrictedPages.isAuth(),
  [
    sanitizeEmail('email', 'required'),
  ],
  userController.getUserDetails
);

router.put('/favorites/add', restrictedPages.isAuth(), userController.addFavoriteOffer);

router.put('/favorites/remove', restrictedPages.isAuth(), userController.removeFavoriteOffer);

router.put('/edit', restrictedPages.isAuth(),
    [
        body('email').isEmail().withMessage('Please enter a valid email!'),
        sanitizePassword('password', 'required'),
        // sanitizeEmail('newEmail'),
        sanitizePassword('newPassword'),
        sanitizeName('name')
    ],
    userController.edit);

router.put('/forgot-password', [
        body('email').isEmail().withMessage('Please enter a valid email!'),
    ],
    userController.forgotPassword);

router.put('/reset-password/:userToken', [
        sanitizePassword('newPassword'),
    ],
    userController.resetPassword);

router.delete('/delete', restrictedPages.isAuth(), userController.delete);

module.exports = router;
