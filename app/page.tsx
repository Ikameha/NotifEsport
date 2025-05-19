import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import LandingImage from "@/components/LandingImage"


export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Section Héros */}
      <section className="flex flex-col md:flex-row items-center gap-8 py-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dark">
            Ne manquez plus aucun match <span className="text-forest">eSport</span>
          </h1>

          <p className="text-lg text-dark/80 max-w-2xl">
            NotifSport vous permet de suivre les matchs à venir de League of Legends et Valorant, et de recevoir des
            rappels personnalisés pour ne jamais manquer un affrontement de vos équipes préférées.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/calendar"
              className="bg-forest text-light px-6 py-3 rounded-md hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 text-center"
            >
              Découvrir le calendrier
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/settings"
              className="border border-forest text-forest px-6 py-3 rounded-md hover:bg-forest/10 transition-colors text-center"
            >
              Personnaliser mes alertes
            </Link>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
  <LandingImage />
</div>

      </section>

      {/* Section Fonctionnalités */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Comment ça fonctionne</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-light border border-forest/20 p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-forest/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-forest font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Choisissez vos jeux</h3>
            <p className="text-dark/70">Sélectionnez les jeux et les ligues que vous souhaitez suivre.</p>
          </div>

          <div className="bg-light border border-forest/20 p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-forest/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-forest font-bold">2</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Explorez le calendrier</h3>
            <p className="text-dark/70">Consultez tous les matchs à venir et filtrez selon vos préférences.</p>
          </div>

          <div className="bg-light border border-forest/20 p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-forest/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-forest font-bold">3</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Recevez des alertes</h3>
            <p className="text-dark/70">Soyez notifié avant le début des matchs qui vous intéressent.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="max-w-3xl mx-auto bg-forest/10 p-8 rounded-xl border border-forest/20">
          <h2 className="text-3xl font-bold mb-4">Prêt à ne plus manquer aucun match ?</h2>
          <p className="text-dark/80 mb-6 max-w-xl mx-auto">
            Rejoignez des milliers de fans d'eSport qui utilisent NotifSport pour suivre leurs équipes préférées.
          </p>
          <Link
            href="/calendar"
            className="bg-forest text-light px-8 py-3 rounded-md hover:bg-forest/90 transition-colors inline-flex items-center gap-2 text-lg"
          >
            Commencer maintenant
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
