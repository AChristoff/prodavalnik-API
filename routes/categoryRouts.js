const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const restrictedPages = require('../middleware/authenticate');
const {sanitizeCategory} = require('../middleware/sanitazie');


router.post('/create',
  restrictedPages.isAuth('Admin'),
  [sanitizeCategory('newCategory')],
  categoryController.createCategory);

router.get('/all', categoryController.getCategories);

module.exports = router;