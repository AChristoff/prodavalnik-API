const {validationResult} = require('express-validator');
const Category = require('../models/Category');

module.exports = {
  createCategory: (req, res, next) => {
    if (validator(req, res)) {
      const {newCategory} = req.body;
      const category = new Category({category: newCategory});

      Category.findOne({category: newCategory})
        .then((cat) => {
        if (!cat) {
          category.save()
            .then((c) => {
              res
                .status(201)
                .json({
                  message: 'Category created successfully!',
                  category: c,
                })
            })
            .catch((error) => {
              if (!error.statusCode) {
                error.statusCode = 500;
              }

              next(error);
            });
        } else {
          const error = new Error('Category exists!');

          error.statusCode = 403;
          error.param = "Can't duplicate categories!";
          throw error;
        }
      }).catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }

        next(error);
      });
    }
  },
  getCategories: (req, res, next) => {

      Category.find()
        .then((categories) => {
          res.status(200).json({
            message: 'Fetched categories successfully.',
            categories,
          });
        }).catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }

        next(error);
      });
    }
};

function validator(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      message: 'Feed data error!',
      errors: errors.array()
    });

    return false;
  }

  return true;
}
