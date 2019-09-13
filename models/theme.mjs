import mongoose from 'mongoose';

const { Schema } = mongoose;

const ThemeSchema = new Schema({
  title: { type: String, required: true, unique: true },
  img: { data: Buffer, contentType: String, size: String },
  published: { type: Boolean, required: true },
});

export default mongoose.model('Theme', ThemeSchema);
