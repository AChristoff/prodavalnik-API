const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: false,
      index: true,
      text: true
    },
    subtitle: {
      type: String,
      required: true,
      unique: false,
      index: true,
      text: true
    },
    content: {
      type: String,
      required: true,
      unique: false,
      index: true,
      text: true
    },
    image: {
      type: String,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

module.exports = mongoose.model('Post', postSchema);
