"use client"

import Image from "next/image"

type Props = {
  children: React.ReactNode
}

export default function OnboardingLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#27c8c0_0%,#16a79a_100%)] p-4 sm:p-6 lg:p-8">
      <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:grid md:min-h-[650px] md:min-w-[1060px] md:max-w-[1060px] md:grid-cols-[730px_330px] md:[height:660px]">
        <div className="min-w-0 border-b border-slate-200 md:border-b-0 md:border-r md:border-slate-200">
          {children}
        </div>

        <div className="relative hidden md:block">
          <Image
            src="/images/nurse.jpg"
            alt="Nexus MedPro nurse"
            fill
            className="object-cover grayscale"
            priority
          />
          <div className="absolute inset-0 bg-white/50" />

          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="flex w-full max-w-[260px] flex-col items-center gap-6 text-center">
              <div className="relative h-[80.218px] w-[270px] max-w-full">
                <Image
                  src="/images/new-logo-nexus.svg"
                  alt="Nexus MedPro Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="flex w-full items-center justify-center gap-4">
                <div className="h-px flex-1 bg-slate-400/55" />
                <Image
                  src="/icons/circle-star-icon.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 flex-none"
                />
                <div className="h-px flex-1 bg-slate-400/55" />
              </div>

              <p className="text-center text-[16px] font-normal leading-6 tracking-normal text-slate-800">
                Nexus MedPro Staffing - Connecting Healthcare professionals with
                service providers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
