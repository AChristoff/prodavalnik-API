const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
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

postSchema.index(
  {
    title: 'text',
    subtitle: 'text',
    category: 'text',
    content: 'text'
  },
  {
    name: "posts_fts",
    weights:
      {
        title: 10,
        subtitle: 5,
        category: 3,
        content: 1,
      }
  }
);

module.exports = mongoose.model('Post', postSchema);
