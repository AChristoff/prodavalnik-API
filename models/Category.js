const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
    },
  }
);

module.exports = mongoose.model('Category', categorySchema);