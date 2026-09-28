import Link from "next/link";
import {
  ArrowLeft,
  BellDot,
  CalendarRange,
  CheckCircle2,
  Droplets,
  Leaf,
  Tractor,
  TrendingUp,
  Users,
} from "lucide-react";

const stats = [
  { label: "Produção total", value: "6.4 t", detail: "+12% vs mês anterior", tone: "bg-emerald-100 text-emerald-700" },
  { label: "Reservas confirmadas", value: "42", detail: "16 em alta temporada", tone: "bg-sky-100 text-sky-700" },
  { label: "Eficiência hídrica", value: "91%", detail: "Dentro da meta", tone: "bg-amber-100 text-amber-700" },
];

const tasks = [
  { title: "Plantio de alface", owner: "Joaquim", status: "Em andamento", progress: 72 },
  { title: "Manutenção do sistema de irrigação", owner: "Equipe técnica", status: "Aguardando peças", progress: 48 },
  { title: "Rota de visitas guiadas", owner: "Maria", status: "Planejada", progress: 84 },
];

const schedule = [
  { time: "08:00", item: "Reunião de produção", detail: "Sala de operação" },
  { time: "10:30", item: "Visita de convidados", detail: "Casa de hóspedes" },
  { time: "14:00", item: "Inspeção de irrigação", detail: "Lote sul" },
  { time: "18:00", item: "Checklist de fechamento", detail: "Grupo de manutenção" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ec]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-full border border-slate-200 bg-white p-2 text-slate-600">
            <BellDot className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#114b2a] text-sm font-semibold text-white">
              AQ
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Amanda</p>
              <p className="text-xs text-slate-500">Operação</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Dashboard</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Painel da quinta</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            <TrendingUp className="h-4 w-4" />
            Operação em alta
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex rounded-2xl p-2 ${stat.tone}`}>
                {stat.label === "Produção total" ? <Leaf className="h-5 w-5" /> : stat.label === "Reservas confirmadas" ? <Users className="h-5 w-5" /> : <Droplets className="h-5 w-5" />}
              </div>
              <p className="mt-4 text-sm text-slate-500">{stat.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
                <span className="text-xs font-medium text-slate-500">{stat.detail}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Atividades prioritárias</p>
                <h2 className="text-2xl font-bold text-slate-900">Tarefas da semana</h2>
              </div>
              <button className="rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white">Ver todas</button>
            </div>

            <div className="space-y-5">
              {tasks.map((task) => (
                <div key={task.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">Responsável: {task.owner}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {task.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span>Progresso</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200">
                      <div className="h-2.5 rounded-full bg-[#114b2a]" style={{ width: `${task.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-[#102b1f] p-6 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-200">Agenda do dia</p>
                <h2 className="mt-2 text-2xl font-bold">Próximos eventos</h2>
              </div>
              <CalendarRange className="h-6 w-6 text-emerald-300" />
            </div>

            <div className="mt-6 space-y-4">
              {schedule.map((item) => (
                <div key={item.time} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.18em] text-emerald-200">{item.time}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  </div>
                  <p className="mt-3 text-lg font-semibold">{item.item}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sustentabilidade</p>
                <h3 className="text-2xl font-bold text-slate-900">Utilização de recursos</h3>
              </div>
              <Tractor className="h-6 w-6 text-emerald-700" />
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Irrigação</span>
                  <span>82%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200">
                  <div className="h-2.5 rounded-full bg-emerald-600" style={{ width: "82%" }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Energia renovável</span>
                  <span>67%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200">
                  <div className="h-2.5 rounded-full bg-sky-500" style={{ width: "67%" }} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Uso de insumos</span>
                  <span>74%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200">
                  <div className="h-2.5 rounded-full bg-amber-500" style={{ width: "74%" }} />
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">KPI</p>
                <h3 className="text-2xl font-bold text-slate-900">Performance geral</h3>
              </div>
              <TrendingUp className="h-6 w-6 text-emerald-700" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Retorno</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">+23%</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-sm text-sky-700">Ocupação</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">84%</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-sm text-amber-700">Satisfação</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">4.8/5</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-sm text-rose-700">Pendências</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">03</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
