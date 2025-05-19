// components/LandingImage.tsx
"use client"

import Image from "next/image"

export default function LandingImage() {
  return (
    <div className="relative w-full max-w-md aspect-square">
      <Image
        src="/image/landing-illustration.png"
        alt="Illustration eSport"
        width={400}
        height={400}
        className="rounded-lg shadow-lg object-contain"
      />
    </div>
  )
}
