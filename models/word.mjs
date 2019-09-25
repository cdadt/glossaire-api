import mongoose from 'mongoose';

const { Schema } = mongoose;

const WordSchema = new Schema({
  title: { type: String, required: true, unique: true },
  definition: { type: String, required: true },
  know_more: String,
  last_edit: Date,
  published: Boolean,
  img: { data: String, size: String },
  themes: [{
    _id: { type: Schema.ObjectId, required: true, alias: 'themes.id' },
    title: { type: String, required: true },
    published: { type: Boolean, required: true },
  }],
  legend: String,
  validated: Boolean,
});

export default mongoose.model('Word', WordSchema);
