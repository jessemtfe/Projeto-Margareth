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

O site exige uma sessão autenticada para acessar páginas e APIs. O cadastro confirma o e-mail pelo Amazon Cognito. Contas novas começam como **Cooperado** e precisam ser vinculadas ao cadastro correspondente em **Gerenciar acessos**. A conta associada ao e-mail administrador configurado recebe o perfil **Presidente**.

Os perfis são aplicados no servidor, além da navegação:

- **Cooperado**: acessa apenas seus turnos, produção e memória de cálculo.
- **Balanceiro**: consulta geradores e registra cargas, pesagens, status e alertas.
- **Presidente**: administra usuários, geradores, cooperados, preços, cargas e fechamento do rateio.

Turnos, produção por material, períodos de rateio e memórias de cálculo são persistidos no banco. O fechamento mensal é recusado se houver turno aberto; depois de fechado, o período e os preços associados não podem ser alterados. O endpoint de fechamento usa os preços ativos por material para a parcela de produção; a parcela por horas permanece explicitamente registrada como zero até a fórmula financeira oficial do rateio ser definida.

Configure `COGNITO_REGION`, `COGNITO_CLIENT_ID`, `ADMIN_EMAIL` e `PUBLIC_APP_URL` no ambiente do servidor, além de `DATABASE_URL`. As tabelas `user_accounts` e `auth_sessions` são criadas no banco por `npx prisma db push`. Cookies de sessão são HttpOnly e Secure em produção; o acesso público de produção deve usar HTTPS.

Para publicar alterações do schema no ambiente ECS, construa o estágio `migrator`, execute `prisma db push` dentro da VPC e, quando aplicável, rode o script de backfill antes de atualizar o serviço web. O `db push` desta versão cria as tabelas `turnos`, `producoes`, `rateio_periodos` e `memorias_rateio` e adiciona o perfil funcional e o vínculo opcional de cooperado em `user_accounts`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
