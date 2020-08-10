const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const ObjectId = Schema.Types.ObjectId;
// const Boolean = Schema.Types.Boolean;

const commentSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: Schema.Types.String,
      minlength: 2,
      maxlength: 400,
      required: true,
    },
    author: {
      type: Schema.Types.String,
      required: true,
    },
    approval: {
      type: Schema.Types.Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Comment', commentSchema);