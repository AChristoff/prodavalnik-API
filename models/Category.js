const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    category: {
      type: Schema.Types.String,
      required: true,
    },
  }
);

module.exports = mongoose.model('Category', categorySchema);