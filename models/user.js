import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';


const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  firstname: String,
  lastname: String,
});

// On crée une méthode qui sera utilisée lors de la création d'un utilisateur
// Cette méthode permet de créer un salt aléatoire (randomBytes) et de définir un hashage (pbkdf2Sync) pour le password
// rappel : hex = hexadécimal
UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

// On créee une méthode qui permettra de vérifier le password
UserSchema.methods.verifPassword = function(password) {
  const userPassword = crypto.pbkdf2Sync(password, this.salt, 1000, 64, "sha512").toString("hex");
  return this.password === userPassword;
};

// On crée une méthode qui génère un jeton avec une date d'expiration et un message secret hashé
UserSchema.methods.generateJwt = function() {
  let expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  expirationDate = String(expirationDate.getTime() / 1000);

  return jwt.sign({
    _id: this._id,
    email: this.email,
    exp: parseInt(expirationDate, 10),
    username: this.username,
  }, "glossaire_secret"); // TODO Secret à mettre dans une variable d'environnement de NODEJS (fichier .env)
};

export default mongoose.model('User', UserSchema);
