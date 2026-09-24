import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  CalendarCheck,
  Camera,
  Car,
  MapPin,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";

const gallery = [
  "Casa principal",
  "Pátio",
  "Horta",
  "Área de eventos",
];

const amenities = [
  { icon: BedDouble, label: "4 quartos" },
  { icon: Car, label: "2 vagas" },
  { icon: Utensils, label: "Cozinha equipada" },
  { icon: ShieldCheck, label: "Segurança 24h" },
];

const reservations = [
  { title: "Weekend de descanso", guest: "Ana e Carlos", date: "20-22 Jun", status: "Confirmada" },
  { title: "Retiro de trabalho", guest: "Nexa Studio", date: "25 Jun", status: "Em análise" },
  { title: "Visita familiar", guest: "Família Mendes", date: "30 Jun", status: "Pré-reserva" },
];

const checklist = [
  "Higienização da piscina",
  "Revisão da irrigação",
  "Ajuste de iluminação externa",
  "Inventário de utensílios da cozinha",
];

export default function QuintaPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ec]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Início
          </Link>
        </div>

        <Link href="/dashboard" className="rounded-full bg-[#114b2a] px-4 py-2 text-sm font-semibold text-white">
          Ir para dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.14fr_0.86fr]">
            <div className="bg-[linear-gradient(135deg,#163f2a_0%,#0d2618_100%)] p-8 text-white md:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-emerald-100">
                <Sparkles className="h-4 w-4" />
                Quinta do Vale
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Experiência rural com conforto premium</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/80">
                Uma propriedade com ambiente acolhedor, produção sustentável e infraestrutura pensada para receber famílias, eventos e experiências gastronômicas.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-emerald-50/80">
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Santana do Campo</span>
                <span className="flex items-center gap-2"><Camera className="h-4 w-4" /> 360° visual</span>
              </div>
            </div>

            <div className="grid gap-4 bg-slate-100 p-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {gallery.map((label, index) => (
                <div key={label} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 h-28 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.35),_rgba(15,23,42,0.65)_60%)]" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{label}</span>
                    <span className="text-xs text-slate-500">0{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Detalhes</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Comodidades</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {amenities.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Reservas</p>
                <h2 className="text-3xl font-bold text-slate-900">Próximos agendamentos</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                <CalendarCheck className="h-4 w-4" />
                03 previstas
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{reservation.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{reservation.guest}</p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                      {reservation.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-emerald-700">{reservation.date}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-[1fr_0.9fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Checklist</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Preparação operacional</h2>

            <ul className="mt-6 space-y-4">
              {checklist.map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    ✓
                  </span>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[28px] bg-[#102b1f] p-6 text-white shadow-sm">
            <p className="text-sm text-emerald-200">Indicadores</p>
            <h2 className="mt-2 text-3xl font-bold">Resumo da propriedade</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-emerald-100">Taxa de ocupação</p>
                <p className="mt-2 text-3xl font-bold">84%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-emerald-100">Avaliação média</p>
                <p className="mt-2 text-3xl font-bold">4.8/5</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-emerald-100">Progresso da sprint</p>
                <p className="mt-2 text-3xl font-bold">72%</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
