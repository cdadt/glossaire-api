import mongoose from 'mongoose';

const { Schema } = mongoose;

const ThemeSchema = new Schema({
  title: { type: String, required: true, unique: true },
  img: { data: String, size: String },
  published: { type: Boolean, required: true },
},
{
  collation: { locale: 'fr', strength: 1 },
});

export default mongoose.model('Theme', ThemeSchema);
