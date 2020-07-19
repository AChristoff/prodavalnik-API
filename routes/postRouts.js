const router = require('express').Router();
const postController = require('../controllers/postController');
const restrictedPages = require('../middleware/authenticate');
const {sanitizeTitle, sanitizeContent} = require('../middleware/sanitazie');


router.post('/post/create', restrictedPages.isAuth(),
    [
        sanitizeTitle('title'),
        sanitizeContent('content'),
    ],
    postController.createPost);

router.put('/post/edit/:postId', restrictedPages.isAuth(),
    [
        sanitizeTitle('title'),
        sanitizeContent('content'),
    ],
    postController.editPost);

router.get('/post/:postId', postController.getPostById);

router.get('/posts/all/:page/:resPerPage/:sortBy?/:order?', postController.getPosts);

router.get('/posts', restrictedPages.isAuth(), postController.getUserPosts);

router.delete('/post/delete/:postId', restrictedPages.isAuth(), postController.deletePost);

module.exports = router;
