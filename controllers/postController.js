const {validationResult} = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');

module.exports = {
    getPosts: (req, res, next) => {

        Post.find()
            .then((posts) => {
                res
                    .status(200)
                    .json({message: 'Fetched posts successfully.', posts});
            })
            .catch((error) => {
                if (!error.statusCode) {
                    error.statusCode = 500;
                }

                next(error);
            });
    },
    createPost: (req, res, next) => {

        if (validator(req, res)) {
            const {title, subtitle, content, image} = req.body;
            const post = new Post({title, subtitle, content, image, creator: req.userId});
            let creator;

            post.save()
                .then(() => {
                    return User.findById(req.userId);
                })
                .then((user) => {
                    user.posts.push(post);
                    creator = user;
                    return user.save();
                })
                .then(() => {
                    res
                        .status(201)
                        .json({
                            message: 'Post created successfully!',
                            post: post,
                            creator: {userId: req.userId, name: creator.name}
                        })
                })
                .catch((error) => {
                    if (!error.statusCode) {
                        error.statusCode = 500;
                    }

                    next(error);
                });
        }
    },
    deletePost: (req, res, next) => {
        const postId = req.params.postId;

        Post.findById(postId)
            .then((post) => {
                if (!post) {
                    const error = new Error('Post not found!');
                    error.statusCode = 404;
                    throw error;
                }

                if (post.creator.toString() !== req.userId && req.userRole !== 'Admin') {
                    const error = new Error('Unauthorized');
                    error.statusCode = 403;
                    error.param = 'Only the author or admin can delete the post!';
                    throw error;
                }

                return Post.findByIdAndDelete(postId);
            })
            .then(() => {
                return User.findById(req.userId);
            })
            .then((user) => {
                user.posts.pull(postId);
                return user.save();
            })
            .then(() => {
                res.status(200)
                    .json({
                        message: 'Post deleted successfully!'
                    })
            })
            .catch((error) => {
                if (!error.statusCode) {
                    error.statusCode = 500;
                }

                next(error);
            });
    },
    getPostById: (req, res, next) => {
        const postId = req.params.postId;

        Post.findById(postId)
            .then((post) => {
                res
                    .status(200)
                    .json({message: 'Post fetched.', post})
            })
            .catch((error) => {
                if (!error.statusCode) {
                    error.statusCode = 500;
                }

                next(error);
            });
    },
    editPost: (req, res, next) => {

        if (validator(req, res)) {
            const postId = req.params.postId;
            const post = req.body;

            const isAdmin = req.userRole === 'Admin';

            Post.findById(postId)
                .then((p) => {
                    if (!p) {
                        const error = new Error('Post not found');
                        error.statusCode = 404;
                        throw error;
                    }

                    if (p.creator.toString() !== req.userId && !isAdmin) {
                        const error = new Error('Unauthorized');
                        error.statusCode = 403;
                        error.param = 'Only the author or admin can edit the post!';
                        throw error;
                    }

                    p.title = post.title;
                    p.content = post.content;

                    if (post.approval && isAdmin) {
                        p.approval = post.approval;
                    }

                    return p.save();
                })
                .then((p) => {
                    if (p) {
                        res.status(200).json({
                            message: 'Post updated!',
                            post: p
                        })
                    }
                })
                .catch((error) => {
                    if (!error.statusCode) {
                        error.statusCode = 500;
                    }

                    next(error);
                });
        }
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
