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

postSchema.index({ title: 'text', subtitle: 'text', content: 'text'});

module.exports = mongoose.model('Post', postSchema);
