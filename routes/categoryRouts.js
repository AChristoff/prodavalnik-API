const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const restrictedPages = require('../middleware/authenticate');
const {sanitizeCategory} = require('../middleware/sanitazie');

router.post(
  '/create',
  restrictedPages.isAuth('Admin'),
  [sanitizeCategory('newCategory')],
  categoryController.createCategory
);

router.put(
  '/edit',
  restrictedPages.isAuth('Admin'),
  [sanitizeCategory('newCategoryName')],
  categoryController.editCategory
);

router.delete(
  '/delete',
  restrictedPages.isAuth('Admin'),
  [sanitizeCategory('category')],
  categoryController.deleteCategory
);

router.get('/all', categoryController.getCategories);

module.exports = router;