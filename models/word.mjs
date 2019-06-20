import mongoose from 'mongoose';

const { Schema } = mongoose;

const WordSchema = new Schema({
  title: { type: String, required: true, index: { unique: true } },
  definition: { type: String, required: true },
  know_more: String,
  last_edit: Date,
  themes: [{
    _id: { type: Schema.ObjectId, required: true, alias: 'themes.id' },
    title: { type: String, required: true },
  }],
});

export default mongoose.model('Word', WordSchema);
