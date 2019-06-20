import mongoose from 'mongoose';

const { Schema } = mongoose;

const ThemeSchema = new Schema({
  title: { type: String, required: true, unique: true },
});

export default mongoose.model('Theme', ThemeSchema);
