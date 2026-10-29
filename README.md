# EcoCat

Sistema web para apoiar a operação de uma cooperativa de reciclagem: geradores, cooperados, preços, cargas, turnos, produção e rateio mensal.

**Aplicação publicada:** [ecocat.vercel.app](https://ecocat.vercel.app)

## Tecnologias e ambiente

- Next.js, React e TypeScript.
- Prisma ORM com MySQL compatível no TiDB Cloud.
- Hospedagem de produção na Vercel.

## Desenvolvimento local

Requer Node.js compatível com Next.js 16 e acesso autorizado a uma base de desenvolvimento.

1. Instale dependências com `npm ci`.
2. Configure `DATABASE_URL`, `ADMIN_EMAIL` e `PUBLIC_APP_URL` em `.env`, sem compartilhar ou versionar o arquivo.
3. Execute `npx prisma generate`; aplique o schema somente à base de desenvolvimento pretendida com `npx prisma db push`.
4. Inicie o servidor local com `npm run dev`.

O servidor local serve apenas para desenvolvimento. A versão acessível ao público está hospedada em Vercel pelo link acima.

## Perfis e permissões

- **Presidente:** gerencia usuários, cadastros, preços, cargas, alertas e fechamento mensal.
- **Balanceiro:** consulta geradores, registra turnos (entrada e saída) e produção por cooperado, além de registrar/acompanhar cargas, pesagens e etapas.
- **Cooperado:** consulta apenas suas próprias horas, produção e memórias fechadas; não cadastra nem altera esses registros.

As permissões são verificadas no servidor, além da navegação apresentada pela interface.

## Regras operacionais

### Cargas e alertas

Uma carga avança apenas nesta ordem: **Recebida → Pesada → Em triagem → Triada → Vendida**. Cargas recusadas na entrada não avançam. Não é permitido pular ou retroceder etapas.

O alerta é gerado quando as três cargas mais recentes do mesmo gerador têm rejeito **superior a 25%**. Exatamente 25% não atende à condição e interrompe a sequência. Pesos abaixo de 1 kg ou acima de 10.000 kg pedem confirmação antes de salvar.

### Turnos, produção e rateio

Turnos precisam ter entrada e saída válidas no mesmo dia; turnos abertos não compõem o rateio. Domingos são identificados automaticamente, e feriados locais/móveis devem ser marcados manualmente. Domingo e feriado contam em dobro na parcela de horas.

O fundo do rateio corresponde à produção mensal avaliada pelos preços ativos da competência, dividido igualmente entre horas ponderadas e produção. Com menos de 60 horas reais, o cooperado participa apenas da parcela de horas; exatamente 60 horas dá direito à parcela de produção. Mais de 180 horas reais gera bônus adicional de 10% da parcela individual de produção, não descontado dos demais.

O fechamento da competência é bloqueado por turno aberto ou inconsistências impeditivas. O registro fechado preserva a memória e bloqueia alterações nos preços, turnos e produção daquele mês.

## Validação

```powershell
npm run test:sprint5
npx tsc --noEmit
npm run lint -- --no-cache
npx prisma validate
npm run build
```

O smoke test opcional `npm run test:db-smoke` só faz consultas de leitura e imprime contagens agregadas. Forneça `DATABASE_URL` por um ambiente seguro; nunca inclua a URL em logs/capturas nem execute testes de escrita na base compartilhada de produção.

## Documentação da entrega

- A documentação funcional cobre **todas as Sprints 1–5**: [requisitos, escopo e entregas por sprint](./docs/requisitos-e-escopo.md).
- [Diagrama de casos de uso](./docs/diagrama-casos-de-uso.mmd)
- [Modelo de dados](./docs/modelo-dados.mmd)
- [Relatório de testes do sistema](./docs/relatorio-testes.md)
- [Checklist de evidências](./docs/evidencias.md)
- [Roteiro da apresentação](./docs/roteiro-apresentacao.md)

Os diagramas, relatório, evidências e roteiro referem-se ao produto completo, não somente à Sprint 5. Para registrar evidências E2E, preparar primeiro um ambiente de demonstração e contas fictícias. Não adicionar credenciais nem capturas contendo dados pessoais ao repositório.

## Banco e deploy

O site público usa Next.js na Vercel e MySQL compatível no TiDB Cloud. Configure `DATABASE_URL`, `ADMIN_EMAIL` e `PUBLIC_APP_URL` no ambiente de hospedagem. Valide alterações de schema em ambiente isolado e aplique `npx prisma db push` somente à base pretendida.

O arquivo `.env` é local e não deve ser versionado. Se uma credencial for exposta, revogue/rotacione-a no provedor e atualize os ambientes autorizados.
