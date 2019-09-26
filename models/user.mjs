import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../services/config';

const { Schema } = mongoose;

const SALT_ROUNDS = 10;
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstname: String,
  lastname: String,
  permissions: Number,
  activated: { type: Boolean, default: false },
  bookmark: [{
    _id: { type: Schema.ObjectId, required: true, alias: 'bookmark.id' },
    title: { type: String, required: true },
    definition: { type: String, required: true },
    validated: { type: Boolean, required: true },
    published: { type: Boolean, required: true },
  }],
  reset_code: String,
});

UserSchema.pre('save', function preSave(next) {
  if (!this.isModified('password') || !this.password) {
    next();
  }
  bcrypt
    .hash(this.password, SALT_ROUNDS)
    .then((password) => {
      this.password = password;
      next();
    })
    .catch(err => next(err));
});

UserSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.signJWT = function signJWT() {
  const payload = {
    email: this.email,
    username: this.username,
  };

  return jwt.sign(
    payload,
    config.get('token:secret'),
    { expiresIn: parseInt(config.get('token:duration'), 10) },
  );
};

export default mongoose.model('User', UserSchema);
