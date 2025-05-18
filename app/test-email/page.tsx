'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Veuillez entrer une adresse email');
      return;
    }

    setIsSending(true);
    setMessage('Envoi en cours...');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Test depuis NotifEsport',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
              <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 20px;">Test d'email réussi !</h1>
              <p>Bonjour,</p>
              <p>Cet email est un test de la fonctionnalité d'envoi d'emails de NotifEsport.</p>
              <p>Si vous recevez ce message, c'est que la configuration est correcte !</p>
              
              <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <a href="https://notifesport.fr" 
                  style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; 
                        text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 16px;">
                  Visiter NotifEsport
                </a>
              </div>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de l\'email');
      }
      
      setMessage('Email envoyé avec succès ! Vérifiez votre boîte de réception.');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du test:', error);
      setMessage(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Tester l'envoi d'emails
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entrez une adresse email pour envoyer un email de test
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Adresse email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSending}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isSending ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isSending ? 'Envoi en cours...' : 'Envoyer un email de test'}
            </button>
          </div>
          
          {message && (
            <div className={`p-3 rounded-md ${
              message.includes('Erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
