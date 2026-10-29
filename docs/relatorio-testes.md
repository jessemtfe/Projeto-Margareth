# EcoCat — Relatório de testes do sistema (Sprints 1–5)

## Escopo

Verificação do produto desenvolvido nas Sprints 1–5. A cobertura automatizada disponível inclui as regras puras de turnos, cálculo do rateio, limites de elegibilidade, arredondamento, sequência de cargas, alerta por rejeito e transições de status. Também foram executados type-check, lint, build, validação do schema Prisma, smoke test de leitura do MySQL/TiDB e verificação HTTP pública. Não foram executados fluxos autenticados E2E.

O foco desta execução foi a validação de entrega da Sprint 5; os resultados não devem ser interpretados como aprovação E2E de cada tela e operação das Sprints 1–4.

## Execuções registradas

| Verificação | Resultado | Observações |
|---|---|---|
| `npm run test:sprint5` | Aprovado — 18 testes | Suítes de turnos, rateio e cargas; 0 falhas. |
| `npx tsc --noEmit` | Aprovado | Sem diagnósticos TypeScript. |
| `npm run lint -- --no-cache` | Aprovado — 0 erros | Um aviso preexistente de variável sem uso em `src/app/precos/page.tsx`. |
| `npx prisma validate` | Aprovado | Schema válido; Prisma emite avisos sobre índices com `relationMode = "prisma"`. |
| `npm run build` | Aprovado | Build de produção Next.js. |
| `npm run test:db-smoke` | Aprovado — somente leitura | Conexão e contagens agregadas confirmadas; nenhum dado alterado. No momento do teste: 8 geradores, 1 cooperado, 10 preços, 10 cargas, 0 turnos, 0 produções e 0 períodos de rateio. |
| Verificação HTTP pública | Aprovado | `/rateio` redirecionou sem sessão (HTTP 307); `/login` respondeu HTTP 200. Não equivale a teste autenticado das telas. |
| `git diff --check` | Aprovado | Sem erros de whitespace. |

Execuções realizadas em 29/10/2026. A base consultada contém os dados de cargas/preços de teste existentes, mas não contém turnos nem produção; por isso, o smoke test comprova conectividade e consulta, não o ciclo completo de persistência do rateio.

## Cenários unitários incluídos

- Rejeito estritamente acima de 25%, limite exatamente igual a 25% e reinício da sequência.
- Separação de cargas por gerador e normalização de nomes históricos sem vínculo.
- Progressão de status de carga e estado terminal.
- Validação de data/horário, duração e turnos abertos.
- Horas reais versus ponderadas em domingos e feriados.
- Elegibilidade da produção nos limites de 60 horas e bônus acima de 180 horas.
- Fundo 50/50, diferentes materiais/preços, memória detalhada e centavos distribuídos deterministicamente.
- Bloqueio de cálculo/fechamento diante de turnos inválidos, preços ausentes ou duplicados.

## Limites e testes manuais restantes

Não são executados testes E2E autenticados contra o banco de produção: isso exigiria contas de teste e inserções operacionais. Para confirmar persistência de ponta a ponta, usar uma base de demonstração isolada e seguir [evidências e checklist](./evidencias.md). Não criar registros fictícios no banco compartilhado de produção para o teste de apresentação.

O smoke test de leitura comprova conectividade e disponibilidade das consultas, mas não substitui testes de criação/edição/fechamento em banco isolado. O redirecionamento HTTP público também não comprova todos os fluxos internos ou permissões autenticadas.

## Histórico e limites

Os cenários de interface e operações autenticadas de criar/editar/fechar não foram executados como E2E nesta revisão, pois isso exigiria uma base de demonstração e contas de teste próprias. A verificação pública do deploy limitou-se à resposta HTTP e ao redirecionamento de autenticação. Não há capturas reais anexadas; seguir [evidências e checklist](./evidencias.md) durante o ensaio autenticado em ambiente de demonstração.
