// lib/email.ts
import { Resend } from 'resend';

// Créer une instance de Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Envoie un email en utilisant l'API Resend
 * @param options Les options d'envoi d'email
 * @returns Un objet contenant le succès de l'opération et les données de réponse
 * @throws Une erreur si l'envoi échoue
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = 'NotifEsport <notifications@notifesport.fr>',
}: SendEmailOptions): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Vérification de la configuration
    if (!process.env.RESEND_API_KEY) {
      const errorMsg = 'Erreur de configuration: La clé API Resend n\'est pas définie';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Validation des entrées
    if (!to || (Array.isArray(to) && to.length === 0)) {
      const errorMsg = 'L\'adresse email du destinataire est requise';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!subject.trim()) {
      const errorMsg = 'Le sujet de l\'email est requis';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!html.trim()) {
      const errorMsg = 'Le contenu HTML de l\'email est requis';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Envoi d\'email à:', to, 'avec le sujet:', subject);
    
    // Envoi de l'email
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('Erreur Resend lors de l\'envoi de l\'email:', error);
      return { 
        success: false, 
        error: error.message || 'Erreur inconnue lors de l\'envoi de l\'email' 
      };
    }

    console.log('Email envoyé avec succès:', data);
    return { success: true, data };
    
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Une erreur inconnue est survenue lors de l\'envoi de l\'email';
    
    console.error('Erreur dans sendEmail:', errorMessage, error);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}