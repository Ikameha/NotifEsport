import { Resend } from 'resend';

// Créer une instance de Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY);

// Vérification de la présence de la clé API
if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
  console.warn(
    'Avertissement: La variable d\'environnement RESEND_API_KEY n\'est pas définie.\n' +
    'Les fonctionnalités d\'envoi d\'email ne fonctionneront pas correctement.'
  );
}

export default resend;
