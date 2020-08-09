const {validationResult} = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');

module.exports = {
  getPosts: (req, res, next) => {
    //pagination
    const page = Number(req.params.page) || 1;
    const limit = Number(req.params.limit) || 6;
    let postsCount = 0;
    //sort
    const sortBy = req.params.sortBy || 'createdAt';
    const order = req.params.order || '1';
    const sortCriteria = {[sortBy]: order};
    //filter
    const filterCriteria = req.query || '';
    //search
    let searchCriteria = req.params.search.replace('search=', '');
    searchCriteria = searchCriteria ? {$text: {$search: searchCriteria}} : '';

    Post.find({
      ...searchCriteria,
      ...filterCriteria,
    })
      .then((posts) => {
        postsCount = posts.length || 0;
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }
        next(error);
      });

    Post.find({
      ...searchCriteria,
      ...filterCriteria,
    }).sort(sortCriteria)
      .skip((limit * page) - limit)
      .limit(limit)
      .then((posts) => {
        res.status(200).json({
          message: 'Fetched posts successfully.',
          count: postsCount,
          posts,
        });
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }
        next(error);
      });
  },
  getUserPosts: (req, res, next) => {

    Post.find({creator: req.userId})
      .then((posts) => {
        res
          .status(200)
          .json({message: 'User posts fetched successfully.', posts});
      })
      .catch((error) => {
        if (!error.statusCode) {
          error.statusCode = 500;
        }

        next(error);
      });
  },
  getFavoritesPosts: (req, res, next) => {
    //pagination
    const page = Number(req.params.page) || 1;
    const limit = Number(req.params.limit) || 6;
    //sort
    const sortBy = req.params.sortBy || 'createdAt';
    const order = req.params.order || '1';
    const sortCriteria = {[sortBy]: order};
    //filter
    const filterCriteria = req.query || '';
    //search
    let searchCriteria = req.params.search.replace('search=', '');
    searchCriteria = searchCriteria ? {$text: {$search: searchCriteria}} : '';

    User.findOne({_id: req.userId})
      .then((user) => {
        Post.find({
          _id: {$in: user.favorites},
          ...searchCriteria,
          ...filterCriteria,
        }).sort(sortCriteria)
          .skip((limit * page) - limit)
          .limit(limit)
          .then((posts) => {
            res
              .status(200)
              .json({
                message: 'Favorite posts fetched successfully.',
                posts,
                count: user.favorites.length,
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
  createPost: (req, res, next) => {

    if (validator(req, res)) {
      const {title, subtitle, content, category, price, image} = req.body;
      const post = new Post({title, subtitle, content, category, price, image, creator: req.userId});
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
          p.subtitle = post.subtitle;
          p.content = post.content;
          p.category = post.category;
          p.price = post.price;
          p.image = post.image;

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
  },
  createComment: async (req, res, next) => {

    if (validator(req, res)) {
      const postId = req.params.postId;
      const userId = req.userId;
      const content = req.body.content;

      try {
        const comment = await new Comment({post: postId, user: userId, content: content});
        comment.save();

        const user = await User.findById(userId);
        user.comments.push(comment._id);
        await user.save();

        res
          .status(201)
          .json({
            message: 'Comment created successfully!',
            comment: comment,
            creator: userId,
          })
      } catch (error) {
        if (!error.statusCode) {
          error.statusCode = 500;
        }

        next(error);
      }
    }
  },
  getComments: (req, res, next) => {

    if (validator(req, res)) {
      const postId = req.params.postId;

      Comment.find({post: postId})
        .then((comments) => {

          if (!comments.length) {
            res
              .status(404)
              .json({message: 'No comments found!', comments});
          }

          res
            .status(200)
            .json({message: 'Comments fetched successfully.', comments});
        })
        .catch((error) => {
          if (!error.statusCode) {
            error.statusCode = 500;
          }

          next(error);
        });
    }
  },
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
