import Link from "next/link";
import {
  ArrowRight,
  Cat,
  Factory,
  Package2,
  Users,
} from "lucide-react";

const screens = [
  {
    title: "Cadastro de geradores",
    description: "Cadastro do nome, tipo e histórico de rejeito dos geradores da cooperativa.",
    href: "/geradores",
    icon: Factory,
    accent: "bg-[#edf0e5] text-[#465a3e]",
  },
  {
    title: "Cadastro de cooperados",
    description: "Dados do cooperado, situação do mês e controle de produção e horas trabalhadas.",
    href: "/cooperados",
    icon: Users,
    accent: "bg-sky-100 text-sky-700",
  },
  {
    title: "Tabela de preços",
    description: "Preços por material, por mês e estrutura dos valores aplicados no rateio.",
    href: "/precos",
    icon: Package2,
    accent: "bg-amber-100 text-amber-700",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2f3c2d] text-[#edf0e5] shadow-sm ring-1 ring-[#4d5f40]/30">
              <Cat className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight text-[#2d392b]">Margareth</p>
            </div>
          </div>
        </header>

        <section className="rounded-[30px] bg-[radial-gradient(circle_at_top_left,_rgba(118,136,102,0.26),_transparent_35%),linear-gradient(135deg,#202919_0%,#2d392b_45%,#455b3d_100%)] p-8 text-white shadow-2xl shadow-[#1e2a1c]/20 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#e8f0df]">Produto para cooperativas de reciclagem</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
            Sistema que calcula o rateio com transparência, clareza e rastreabilidade.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#edf0e5]/85">
            A Margareth automatiza a distribuição de faturamento entre cooperados com base em horas trabalhadas e produção, eliminando cálculos manuais e divergências entre os dados.
          </p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {screens.map(({ title, description, href, icon: Icon, accent }) => (
            <Link key={title} href={href} className="group rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className={`mb-5 inline-flex rounded-2xl p-3 ${accent}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#465a3e] group-hover:text-[#2d392b]">
                Abrir tela
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </section>

      </div>
    </main>
  );
}
