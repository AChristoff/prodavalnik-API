const {validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const encryption = require('../util/encryption');
const mailer = require('../util/mailer');
const {jwtSecret} = require('../config/environment');
const {decodeToken} = require('../middleware/authenticate');

module.exports = {

  getUserById: (req, res, next) => {
    //public
    let {userId} = req.params;

    User.findOne({_id: userId},['name', 'email', 'phone'])
    .then((user) => {

        if (!user) {
          const error = new Error('User not found!');

          error.statusCode = 404;
          error.param = 'Invalid id!';
          throw error;
        }
        
        res
          .status(200)
          .json({message: 'User details fetched successfully.', user});
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }

        next(error);
      });
  },
  getUserDetails: (req, res, next) => {
    //private
    User.findOne({_id:req.userId},[
      'name', 
      'email', 
      'phone', 
      'role',
      'posts', 
      'comments',
      'favorites', 
      'createdAt',
      'updatedAt',
    ])
      .then((userDetails) => {

        res
          .status(200)
          .json({message: 'User details fetched successfully.', userDetails});
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }

        next(error);
      });
  },
  addFavoriteOffer: (req, res, next) => {

    let {offerId} = req.body;

    User.findOne({_id: req.userId})
      .then((user) => {

        if (user.favorites.includes(offerId)) {
          return res
            .status(405)
            .json({
              message: 'This offer is already in your favorites!',
              offerId,
            });
        }

        user.favorites.push(offerId);
        user.save();

        Post.findById(offerId)
          .then((post) => {

            post.watched.push(user._id);
            post.save();

            res
              .status(200)
              .json({
                message: 'Added to favorites!',
                offerId,
              });
          })
          .catch((error) => {
            if (!error.statusCode) {
              error.statusCode = 500;
            }

            next(error);
          });

      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }

        next(error);
      });
  },
  removeFavoriteOffer: (req, res, next) => {

    let {offerId} = req.body;

    User.findOne({_id: req.userId})
      .then((user) => {

        user.favorites.pull(offerId);
        user.save();

        Post.findById(offerId)
          .then((post) => {

            post.watched.pull(user._id);
            post.save();

            res
              .status(200)
              .json({
                message: 'Removed from favorites!',
                offerId,
              });
          })
          .catch((error) => {
            if (!error.statusCode) {
              error.statusCode = 500;
            }

            next(error);
          });
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }

        next(error);
      });
  },
  register: (req, res, next) => {
    if (validator(req, res)) {
      const {email} = req.body;

      const userToken = jwt.sign({email}, jwtSecret, {expiresIn: '24h'});
      const confirmLink = `${process.env.FRONT_END_URL}/user/register/confirm/${userToken}`;

      User.findOne({email: email})
        .then((user) => {
          if (!user) {

            const defaultPassword = encryption.generateDefaultPassword();

            const salt = encryption.generateSalt();
            const hashedPassword = encryption.generateHashedPassword(salt, defaultPassword);

            return User.create({
              role: 'User',
              email,
              hashedPassword,
              name: 'N/A',
              phone: 0,
              salt,
              userToken,
              confirmed: false,
              posts: []
            })
          } else {
            user.userToken = userToken;
            return user.save();
          }

        })
        .then(() => {

          const {subject, html} = mailer.templates('emailConfirmation', confirmLink);
          mailer.sendEmail(req, res, email, subject, html);

        })
        .catch((error) => {
          if (!error.statusCode) {
            error.statusCode = 500;
          }

          next(error);
        });
    }
  },
  registerConfirm: (req, res, next) => {
    if (validator(req, res)) {
      const {name, phone, password} = req.body;
      const userToken = req.params.userToken;

      const email = decodeToken(req, res, 'fromParam').email;

      User.findOne({email: email})
        .then((user) => {

          if (!user) {
            const error = new Error('Unauthorized!');

            error.statusCode = 401;
            error.param = 'User not found!';
            throw error;
          }

          if (userToken !== user.userToken) {
            const error = new Error('Unauthorized');

            error.statusCode = 401;
            error.param = 'Invalid token! Your token might bet expired, or you requested a newer one!';
            throw error;
          }

          const hashedPassword = encryption.generateHashedPassword(user.salt, password);

          user.hashedPassword = hashedPassword;
          user.name = name;
          user.phone = phone;
          user.confirmed = true;
          user.userToken = '';

          user.save()
            .then(() => {

              const token = jwt.sign(
                {
                  role: user.role,
                  name,
                  email,
                  userId: user._id.toString()
                },
                jwtSecret,
                {expiresIn: '1h'});

              res.status(200).json(
                {
                  message: 'User created successfully!',
                  username: name,
                  token,
                  userId: user._id.toString()
                });
            })
            .catch((error) => {
              if (!error.statusCode) {
                error.statusCode = 500;
              }

              next(error);
            });


        })
        .catch(error => {
          if (!error.statusCode) {
            error.statusCode = 500;
          }

          next(error);
        });

    }
  },
  login: (req, res, next) => {
    if (validator(req, res)) {
      const {email, password} = req.body;

      User.findOne({email: email})
        .then((user) => {
          if (!user) {
            const error = new Error('User not found!');
            error.statusCode = 401;
            error.param = 'email';
            throw error;
          }

          if (!user.authenticate(password)) {
            const error = new Error('Invalid password!');
            error.statusCode = 401;
            error.param = 'password';
            throw error;
          }

          const token = jwt.sign(
            {
              role: user.role,
              name: user.name,
              email,
              userId: user._id.toString()
            },
            jwtSecret,
            {expiresIn: '24h'});

          res.status(200).json(
            {
              message: 'User successfully logged in!',
              username: user.name,
              role: user.role,
              token,
              userId: user._id.toString()
            });
        })
        .catch(error => {
          if (!error.statusCode) {
            error.statusCode = 500;
          }

          next(error);
        })
    }
  },
  edit: (req, res, next) => {
    if (validator(req, res)) {
      const {email, phone, password, newPassword} = req.body;

      User.findOne({email: email})
        .then((user) => {
          if (req.userEmail !== email) {
            const error = new Error('Invalid credentials!');
            error.statusCode = 401;
            error.param = 'email';
            throw error;
          }

          if (!user.authenticate(password)) {
            const error = new Error('Invalid credentials! Wrong password!');

            error.statusCode = 401;
            error.param = 'password';
            throw error;
          }

          if (user.phone !== phone) {
            user.phone = phone;
          }

          if (newPassword) {
            user.hashedPassword = encryption.generateHashedPassword(user.salt, newPassword);
          }

          if (!newPassword && !phone) {
            const error = new Error('You did not made any changes!');
            error.statusCode = 400;
            throw error;
          }

          user.save()
            .then(() => {
              res.status(200).json({
                message: 'Your details were changed successfully!',
                user: {email: user.email, name: user.name},
              })
            })
            .catch((error) => {
              if (!error.statusCode) {
                error.statusCode = 500;
              }

              next(error);
            });
        })
        .catch(error => {
          if (!error.statusCode) {
            error.statusCode = 500;
          }

          next(error);
        });
    }
  },
  delete: (req, res, next) => {
    if (validator(req, res)) {
      const {email, password} = req.body;

      if (req.userEmail !== email) {
        const error = new Error('Invalid credentials!');
        error.statusCode = 401;
        error.param = 'email';
        throw error;
      }

      if (req.userRole === 'Admin') {
        const error = new Error('Admin can not be deleted!');
        error.statusCode = 403;
        throw error;
      }

      User.findOne({email: email})
        .then((user) => {
          if (!user) {
            const error = new Error('Invalid credentials!');

            error.statusCode = 401;
            error.param = 'email';
            throw error;
          }

          if (!user.authenticate(password)) {
            const error = new Error('Invalid credentials!');

            error.statusCode = 401;
            error.param = 'password';
            throw error;
          }

          return User.deleteOne({email: email});
        })
        .then(() => {

          res.status(200).json(
            {
              message: 'User successfully deleted!',
            });
        })
        .catch(error => {
          if (!error.statusCode) {
            error.statusCode = 500;
          }

          next(error);
        })
    }
  },
  forgotPassword: (req, res, next) => {
    if (validator(req, res)) {
      const email = req.body.email;

      User.findOne({email: email})
        .then((user) => {
          if (!user) {
            const error = new Error('Invalid credentials!');

            error.statusCode = 401;
            error.param = 'This email is not registered!';
            throw error;
          }

          const userToken = jwt.sign({email}, jwtSecret, {expiresIn: '24h'});
          const resetLink = `${process.env.FRONT_END_URL}/user/reset-password/${userToken}`;

          user.userToken = userToken;
          user.save()
            .then(() => {

              const {subject, html} = mailer.templates('resetPassword', resetLink);
              mailer.sendEmail(req, res, email, subject, html);

            })
            .catch((error) => {
              if (!error.statusCode) {
                error.statusCode = 500;
              }

              next(error);
            });
        })
        .catch(error => {
          if (!error.statusCode) {
            error.statusCode = 500;
          }

          next(error);
        })
    }
  },
  resetPassword: (req, res, next) => {
    if (validator(req, res)) {

      const userToken = req.params.userToken;
      const newPassword = req.body.newPassword;
      const email = decodeToken(req, res, 'fromParam').email;

      User.findOne({email: email})
        .then((user) => {
          if (!user) {
            const error = new Error('User not found!');

            error.statusCode = 401;
            error.param = 'Invalid token!';
            throw error;
          }

          if (userToken !== user.userToken) {
            const error = new Error('Unauthorized');

            error.statusCode = 401;
            error.param = 'Invalid token!';
            throw error;
          }

          if (!newPassword) {
            const error = new Error('Invalid input!');

            error.statusCode = 401;
            error.param = 'newPassword';
            throw error;
          }

          user.hashedPassword = encryption.generateHashedPassword(user.salt, newPassword);
          user.userToken = '';

          const token = jwt.sign(
            {
              role: user.role,
              name: user.name,
              email,
              userId: user._id.toString()
            },
            jwtSecret,
            {expiresIn: '24h'});

          user.save()
            .then(() => {
              res.status(200).json(
                {
                  message: 'User password has been reset successfully!',
                  username: user.name,
                  role: user.role,
                  token,
                  userId: user._id
                });

            })
            .catch((error) => {
              if (!error.statusCode) {
                error.statusCode = 500;
              }

              next(error);
            });
        })
        .catch(error => {
          if (!error.statusCode) {
            error.statusCode = 500;
          }

          next(error);
        })
    }
  }
};

function validator(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      message: 'User data error!',
      errors: errors.array()
    });
    return false;
  }
  return true;
}
