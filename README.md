This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Fluxo de cargas

Uma carga precisa de um gerador cadastrado e de um material com preço ativo. Depois de registrada, ela avança somente nesta ordem:

1. Recebida
2. Pesada
3. Em triagem
4. Triada
5. Vendida

Uma carga recusada no recebimento pode ser registrada como **Rejeitada na entrada** e não avança para as etapas seguintes. O sistema não permite pular etapas, voltar para uma etapa anterior nem avançar uma carga já vendida. Cada nova carga referencia o gerador cadastrado. O script `prisma/backfill-carga-geradores.sql` associa cargas históricas somente quando o nome corresponde exatamente a um único gerador cadastrado; cadastros ambíguos não são vinculados automaticamente.

A pesagem é informada em quilogramas. Valores abaixo de 1 kg ou acima de 10.000 kg exibem um aviso e exigem confirmação explícita antes da gravação. A tela **Entrada de carga** acompanha as três entradas mais recentes de cada gerador e alerta quando todas têm rejeito superior a 25% (RN-02). As cargas recusadas no recebimento também permanecem no histórico por gerador.

## Autenticação e permissões

O site exige uma sessão autenticada para acessar páginas e APIs. O cadastro usa senha criptografada com `scrypt` e não depende de um provedor externo de identidade. Contas novas começam bloqueadas, como **Cooperado**, e precisam ser liberadas e vinculadas ao cadastro correspondente em **Gerenciar acessos**. A conta associada ao e-mail administrador configurado recebe o perfil **Presidente**.

Os perfis são aplicados no servidor, além da navegação:

- **Cooperado**: acessa apenas seus turnos, produção e memória de cálculo.
- **Balanceiro**: consulta geradores e registra cargas, pesagens, status e alertas.
- **Presidente**: administra usuários, geradores, cooperados, preços, cargas e fechamento do rateio.

Turnos, produção por material, períodos de rateio e memórias de cálculo são persistidos no banco. O fechamento mensal é recusado se houver turno aberto ou inconsistência nos turnos/preços; depois de fechado, os dados do rateio e os preços associados são preservados e não podem ser alterados.

Configure `ADMIN_EMAIL` e `PUBLIC_APP_URL` no ambiente da Vercel, além de `DATABASE_URL` do TiDB Cloud. As tabelas `user_accounts` e `auth_sessions` são criadas no banco por `npx prisma db push`. Cookies de sessão são HttpOnly e Secure em produção; o acesso público de produção deve usar HTTPS.

Para publicar alterações do schema na Vercel, execute `npx prisma db push` localmente depois de configurar a conexão TiDB e configure as variáveis de ambiente do projeto. O `db push` cria e atualiza as tabelas `turnos`, `producoes`, `rateio_periodos` e `memorias_rateio`, além de adicionar o perfil funcional, a senha criptografada e o vínculo opcional de cooperado em `user_accounts`.

## Sprint 3 — Turnos, produção e rateio

Cooperados vinculados registram a data e o horário de entrada e informam o horário de saída ao encerrar o turno. O servidor valida datas e horários, impede saída anterior ou igual à entrada e calcula as horas do turno; turnos ainda abertos ficam sem duração e não são considerados no cálculo. Domingos são identificados pela data. Feriados móveis e municipais devem ser marcados manualmente como **Feriado**, pois o sistema não presume o calendário local da cooperativa.

Cada registro de produção armazena cooperado, data, material e quilogramas, com validação da data real e da quantidade. No rateio mensal, somente turnos fechados entram no total: horas de domingo e feriado são ponderadas em dobro. Cooperados com menos de 60 horas reais recebem apenas a parcela de horas; exatamente 60 horas já dá direito à parcela de produção.

## Sprint 4 — Rateio mensal e fechamento

A tela **Rateio mensal**, disponível para a Presidente, apresenta a prévia por competência, a produção por material e preço por quilo, a memória individual e os registros inconsistentes. O fundo disponível é a produção do mês avaliada pelos preços ativos, dividido em 50% para horas ponderadas e 50% para produção avaliada dos cooperados elegíveis. O bônus de 10% é adicional à parcela de produção individual quando o cooperado supera 180 horas reais; exatamente 180 horas não recebe o bônus.

O fechamento bloqueia turnos abertos em qualquer competência, turnos inválidos, preços ausentes ou duplicados e parcelas sem cooperados elegíveis. Depois do fechamento, a memória fica imutável, os preços do período não podem ser criados, alterados ou removidos, e não podem ser registrados novos turnos ou produção naquele mês. A memória salva o nome, as horas reais e ponderadas, a produção e os valores por material, as parcelas, o bônus e o total. O endpoint `GET /api/rateio` permite consultar o histórico fechado. Execute `npm run test:sprint4` para validar as regras de rateio; `npm run test:sprint3` valida as regras de turnos.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
