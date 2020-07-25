const router = require('express').Router();
const postController = require('../controllers/postController');
const restrictedPages = require('../middleware/authenticate');
const {sanitizeTitle, sanitizeSubTitle, sanitizeContent, sanitizeCategory, sanitizePrice} = require('../middleware/sanitazie');


router.post('/post/create', restrictedPages.isAuth(),
  [
    sanitizeTitle('title'),
    sanitizeSubTitle('subtitle'),
    sanitizeContent('content'),
    sanitizeCategory('category'),
    sanitizePrice('price'),
  ],
  postController.createPost);

router.put('/post/edit/:postId', restrictedPages.isAuth(),
  [
    sanitizeTitle('title'),
    sanitizeSubTitle('subtitle'),
    sanitizeContent('content'),
    sanitizeCategory('category'),
    sanitizePrice('price'),
  ],
  postController.editPost);

router.get('/post/:postId', postController.getPostById);

router.get('/posts/all/:page?/:limit?/:sortBy?/:order?/:search?/:filters?', postController.getPosts);

router.get('/posts', restrictedPages.isAuth(), postController.getUserPosts);

router.delete('/post/delete/:postId', restrictedPages.isAuth(), postController.deletePost);

module.exports = router;
