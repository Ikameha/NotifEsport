// app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Créer une instance de Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.warn('Avertissement: RESEND_API_KEY n\'est pas définie');
}

export async function POST(request: Request) {
  try {
    // Vérifier la méthode HTTP
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Méthode non autorisée' },
        { status: 405 }
      );
    }

    const { to, subject, html, from } = await request.json();

    // Validation des données
    if (!to) {
      return NextResponse.json(
        { error: 'Le destinataire est requis' },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: 'Le sujet est requis' },
        { status: 400 }
      );
    }

    if (!html) {
      return NextResponse.json(
        { error: 'Le contenu HTML est requis' },
        { status: 400 }
      );
    }

    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: from || 'notifications@notifesport.fr',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return NextResponse.json(
        { error: error.message || 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email envoyé avec succès',
      data 
    });
  } catch (error) {
    console.error('Erreur API send-email:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de l\'envoi de l\'email',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}