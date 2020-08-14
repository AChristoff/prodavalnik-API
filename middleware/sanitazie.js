const User = require('../models/User');
const {body} = require('express-validator');
const passwordRegExp = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[0-9a-zA-Z!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]{6,40}$/;

const sanitizeEmail = (fieldName, isRequired) => {

  return body(fieldName)
    .if((value, {req}) => isRequired === 'required' ? true : value !== '')
    .isEmail().withMessage('Please enter a valid email!')
    .custom((value, {req}) => {
      return User.findOne({email: value})
        .then(user => {
          if (user && user.confirmed === true) {
            return Promise.reject('This email is already registered!');
          }
        })
    })
};

const sanitizePassword = (fieldName, isRequired) => {
  return body(fieldName)
    .if((value, {req}) => isRequired === 'required' ? true : value !== '')
    .trim()
    .matches(passwordRegExp, 'i')
    .withMessage('Password must be between 6-40 chars and contain at least one: uppercase / lowercase / special char / digit');
};

const sanitizeName = (fieldName, isRequired) => {

  return body(fieldName)
    .if((value, {req}) => isRequired === 'required' ? true : value !== '')
    .trim()
    .not()
    .isEmpty().withMessage('Please enter a valid name!')
    .matches(/[\w+]/).withMessage('Name must be alphanumeric A-Z/0-9/_')
    .escape()
    .custom((value, {req}) => {
      return User.findOne({name: value})
        .then(user => {
          if (user) {
            return Promise.reject('This username is already taken. Please try another!');
          }
        })
    })

};

const sanitizePhone = (fieldName, isRequired) => {
  return body(fieldName)
    .if((value, {req}) => isRequired === 'required' ? true : value !== '')
    .trim()
    .not()
    .isEmpty().withMessage('Phone is required')
    .matches(/^[0-9]{9}$/).withMessage('Phone number must be exactly 9 digits!')
    .escape()
};

const sanitizeTitle = (fieldName) => {
  return body(fieldName)
    .trim()
    .not()
    .isEmpty().withMessage('Title is required')
    .escape()
};

const sanitizeSubTitle = (fieldName) => {
  return body(fieldName)
    .trim()
    .escape()
};

const sanitizeContent = (fieldName) => {
  return body(fieldName)
    .trim()
    .not()
    .isEmpty().withMessage('Content is required')
    .escape()
};

const sanitizeCategory = (fieldName) => {
  return body(fieldName)
    .trim()
    .not()
    .isEmpty().withMessage('Category is required')
    .escape()
};

const sanitizePrice = (fieldName) => {
  return body(fieldName)
    .trim()
    .not()
    .isEmpty().withMessage('Price is required')
    .isDecimal().withMessage('Price must be a decimal number')
    .escape()
};

module.exports = {
  sanitizeEmail,
  sanitizePassword,
  sanitizeName,
  sanitizePhone,
  sanitizeTitle,
  sanitizeSubTitle,
  sanitizeContent,
  sanitizeCategory,
  sanitizePrice,
};
