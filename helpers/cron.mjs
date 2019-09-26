import cron from 'node-cron';
import User from '../models/user';

cron.schedule('23 1 * * *', async () => {
  const suppResetCode = await User.updateMany(
    {},
    { $unset: { reset_code: 1 } },
  ).lean();
  console.log('Suppression des codes de réinitialisation de mot de passe : ', suppResetCode);
});
