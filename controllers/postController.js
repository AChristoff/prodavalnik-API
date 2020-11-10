const {validationResult} = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const fs = require('fs');

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
    //status
    const approval = true;

    Post.find({
      ...searchCriteria,
      ...filterCriteria,
      approval,
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
      approval,
    }).sort(sortCriteria)
      .skip((limit * page) - limit)
      .limit(limit)
      .populate('category', 'name')
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
  getPostsForApproval: (req, res, next) => {
    //pagination
    const page = Number(req.params.page) || 1;
    const limit = Number(req.params.limit) || 6;
    let postsCount = 0;
    //sort
    const sortBy = req.params.sortBy || 'createdAt';
    const order = req.params.order || '1';
    const sortCriteria = {[sortBy]: order};
    //filter
    const filterCriteria = req.params.filters
      ? {category: req.params.filters}
      : {};
    //state
    const approvalCriteria = req.query || '';
    //search
    let searchCriteria = req.params.search.replace('search=', '');
    searchCriteria = searchCriteria ? {$text: {$search: searchCriteria}} : '';

    Post.find({
      ...searchCriteria,
      ...filterCriteria,
      ...approvalCriteria,
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
      ...approvalCriteria,
    }).sort(sortCriteria)
      .skip((limit * page) - limit)
      .limit(limit)
      .populate('category', 'name')
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
      .sort({createdAt: -1})
      .populate('category', 'name')
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
          .populate('category', 'name')
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

      if(Number(price) < 1) {
        const error = new Error('Price can not be less than 1!');
          error.statusCode = 400;
          throw error;
      }

      User.findById(req.userId)
        .then((user) => {

          if (user.posts.length >= 6) {
            const error = new Error('Limit Reached! Max 6 offers!');
            error.statusCode = 422;
            throw error;
          }

          return user
        })
        .then((user) => {
          //save image
          const imgData = req.body.image;
          const base64Data = imgData.split(",")[1];
          const imgUrl = `public/images/posts/${user._id}_${Date.now()}.jpeg`
        
          fs.writeFile(imgUrl, base64Data, 'base64', function(err) {
            
            if (err) {
              const error = new Error(err);
              error.statusCode = 500;
              throw error;
            }

            post.image = imgUrl;

            // save post
            post
              .save()
              .then(() => {
                user.posts.push(post);
                creator = user;
                return user.save();
              })
              .then(() => {
                res.status(201).json({
                  message: 'Post created successfully!',
                  post: post,
                  creator: { userId: req.userId, name: creator.name },
                });
              })
              .catch((error) => {
                if (!error.statusCode) {
                  error.statusCode = 500;
                }

                next(error);
              });
          });
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

        //delete post image
        const imgUrl = post.image;
        fs.unlink(imgUrl, (err) => {
          if (err) {
            const error = new Error(err);
            error.statusCode = 500;
            throw error;
          }
        })

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
      .populate('category', 'name')
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

          if (post.approval && isAdmin) {
            p.approval = post.approval;
          }

          const regExp = /public\/images\/posts\/(\w)+.jpeg/g;
          const notBase64 = regExp.test(post.image);

          if (notBase64) {
            p.image = post.image;
          } else {
            //delete old image
            p.image = 'https://blog.crossbrowsertesting.com/wp-content/uploads/2017/08/080317_Bug.png'
            // const imgData = post.image;
            // const base64Data = imgData.split(",")[1];
            // const imgUrl = `public/images/posts/${p.creator}_${Date.now()}.jpeg`
            // const oldImgUrl = `./${p.image}`
  
            // p.image = imgUrl;

            // fs.unlink(oldImgUrl, (err) => {
            //   if (err) {
            //     console.log(err);
            //   }
            // })
            // //save new image
            // fs.writeFile(imgUrl, base64Data, 'base64', function(err) {
              
            //   if (err) {
            //     const error = new Error(err);
            //     error.statusCode = 500;
            //     throw error;
            //   }
            // });
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
  setPostStatus: (req, res, next) => {

    if (validator(req, res)) {
      const post = req.body;
      const postId = post.postId;
      const postStatus = post.approval === "true" ? 'approved' : 'disapproved';

      if (!postId) {
        const error = new Error('Post ID is required!');
        error.statusCode = 404;
        throw error;
      }

      Post.findById(postId)
        .then((p) => {
          if (!p) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
          }

          p.approval = post.approval;

          return p.save();
        })
        .then((p) => {
          if (p) {
            res.status(200).json({
              message: `Offer ${postStatus}!`,
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
        const {name} = await User.findById(userId);
        const comment = await new Comment({post: postId, user: userId, content: content, author: name});
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
        .sort({createdAt: '-1'})
        .then((comments) => {

          if (!comments.length) {
            res
              .status(200)
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
