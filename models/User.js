const mongoose = require('mongoose');
const encryption = require('../util/encryption');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: Schema.Types.String,
      required: true
    },
    hashedPassword: {
      type: Schema.Types.String,
      required: true
    },
    role: {type: mongoose.Schema.Types.String},
    name: {
      type: Schema.Types.String,
      required: true
    },
    salt: {
      type: Schema.Types.String,
      required: true
    },
    userToken: {
      type: Schema.Types.String
    },
    confirmed: Schema.Types.Boolean,
    posts: [{type: Schema.Types.ObjectId, ref: 'Post'}],
    favorites: [{type: Schema.Types.ObjectId, ref: 'Post'}],
  },
  {
    timestamps: true
  }
);

userSchema.method({
  authenticate: function (password) {
    const currentHashedPass = encryption.generateHashedPassword(this.salt, password);

    return currentHashedPass === this.hashedPassword;
  }
});

const User = mongoose.model('User', userSchema);

User.seedAdmin = async () => {
  const users = await User.find();

  try {

    if (users.length > 0) {
      return;
    }

    const salt = encryption.generateSalt();
    const hashedPassword = encryption.generateHashedPassword(salt, process.env.ADMIN_PASSWORD);

    return User.create({
      role: 'Admin',
      email: process.env.ADMIN_EMAIL,
      hashedPassword,
      name: process.env.ADMIN_NAME,
      salt,
      userToken: '',
      confirmed: true,
      posts: [],
      favorites: [],
    });
  } catch (e) {
    console.error(e);
  }
};

module.exports = User;
