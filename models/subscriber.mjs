import mongoose from 'mongoose';

const { Schema } = mongoose;

const SubscriberSchema = new Schema({
  endpoint: { type: String, required: true },
  keys: {
    auth: { type: String, required: true },
    p256dh: { type: String, required: true },
  },
});

export default mongoose.model('Subscriber', SubscriberSchema);
