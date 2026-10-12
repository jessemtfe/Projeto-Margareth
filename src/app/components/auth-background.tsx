import Image from "next/image";

export default function AuthBackground() {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <Image
          src="/login-recycling.png"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b3025]/75 via-[#0b3025]/40 to-[#0b3025]/5" />
      </div>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full sm:block"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <path
          fill="#103b30"
          d="M0 0h920c-32 86-67 177-98 274-49 153-64 258-14 384 28 70 68 163 92 242H0V0Z"
        />
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[#103b30]/90 sm:hidden"
      />
    </>
  );
}
