import mongoose from 'mongoose';

const connect = async (mongoDbUrl) => {
  try {
    await mongoose.connect(mongoDbUrl, { useNewUrlParser: true });
    // eslint-disable-next-line no-console
    console.log('MongoDB connecté !');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection échouée, nouvelle tentative dans 10 sec.');
    await new Promise((accept) => {
      setTimeout(accept, 10000);
    });
    await connect(mongoDbUrl);
  }
};
export default connect;
