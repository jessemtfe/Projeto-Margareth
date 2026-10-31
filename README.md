# ♻️ EcoCat — Sistema de Gestão e Rateio para Cooperativas de Reciclagem

O **EcoCat** é um sistema desenvolvido para auxiliar cooperativas de reciclagem no gerenciamento de suas operações e no cálculo transparente do rateio mensal entre os cooperados.

O projeto foi desenvolvido com o objetivo de substituir controles manuais, organizar os registros de cargas, turnos e produção, além de disponibilizar uma memória de cálculo que permita acompanhar como os valores do rateio são definidos.

## 🎯 Objetivo do projeto

Centralizar as informações da cooperativa em um único sistema, proporcionando:

- Maior transparência na distribuição dos valores.
- Redução de erros nos cálculos manuais.
- Organização dos registros de cargas e materiais.
- Controle de horas trabalhadas e produção individual.
- Consulta ao histórico e à memória de cálculo do rateio.

## 🚀 Funcionalidades

### Cadastros

- Cadastro e gerenciamento de geradores.
- Cadastro e gerenciamento de cooperados.
- Cadastro de materiais e preços por quilograma.
- Histórico de rejeitos dos geradores.

### Gestão de cargas

- Registro de entrada de cargas.
- Identificação do gerador responsável.
- Registro de material e peso recebido.
- Controle do ciclo de vida das cargas.
- Identificação de rejeitos.
- Alertas para geradores com índices elevados de rejeito.

### Controle operacional

- Registro de entrada e saída dos cooperados.
- Controle de turnos e horas trabalhadas.
- Identificação de domingos e feriados.
- Registro da produção individual por material.
- Validação dos registros antes do fechamento mensal.

### Cálculo do rateio

- Cálculo do valor disponível com base na produção e nos preços ativos dos materiais.
- Divisão do valor em duas parcelas: horas trabalhadas e produção.
- Distribuição proporcional às horas ponderadas.
- Elegibilidade da parcela de produção a partir de 60 horas reais.
- Bônus adicional de 10% na parcela individual de produção para cooperados com mais de 180 horas reais.
- Geração da memória de cálculo individual.
- Fechamento mensal com validação de inconsistências.

### Relatórios

- Consulta aos valores do rateio.
- Memória de cálculo por cooperado.
- Relatórios de produção.
- Indicadores de rejeitos por gerador.
- Identificação de inconsistências operacionais.

## 👥 Perfis de acesso

| Perfil | Permissões |
|---|---|
| **Presidente** | Gerenciamento de cadastros, consulta geral, fechamento do rateio e relatórios. |
| **Balanceiro** | Registro de cargas, turnos e produção. |
| **Cooperado** | Consulta dos próprios registros, produção e memória de cálculo. |

As permissões são verificadas no servidor para proteger os dados e limitar o acesso de cada perfil.

## 🛠️ Tecnologias utilizadas

### Frontend

- React
- Next.js
- TypeScript
- CSS

### Backend e banco de dados

- APIs do Next.js
- MySQL
- Prisma ORM

### Testes e validação

- Testes automatizados com Node.js
- Validação de tipos com TypeScript
- Validação do schema Prisma

## 📋 Regras de negócio

- Um turno aberto não é contabilizado até que seja registrado o horário de saída.
- Um cooperado não pode possuir mais de um turno aberto simultaneamente.
- Domingos e feriados possuem peso dobrado no cálculo das horas para o rateio.
- A parcela de produção exige pelo menos 60 horas reais trabalhadas.
- Cooperados com mais de 180 horas reais recebem bônus adicional de 10% sobre sua parcela individual de produção.
- O fechamento mensal não pode ocorrer enquanto existirem inconsistências impeditivas.
- Após o fechamento, os registros da competência ficam protegidos contra alterações.

## ⚙️ Instalação e execução

### Pré-requisitos

- Node.js
- npm
- MySQL

### 1. Clone o repositório

```bash
git clone URL_DO_REPOSITORIO
```

### 2. Entre na pasta do projeto

```bash
cd ecocat
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto e configure a conexão com o banco de dados:

```env
DATABASE_URL="mysql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO"
```

Substitua os valores pelos dados da sua conexão MySQL.

### 5. Configure o Prisma

```bash
npx prisma generate
npx prisma db push
```

### 6. Execute o projeto

```bash
npm run dev
```

O sistema ficará disponível em:

```text
http://localhost:3000
```

## 🧪 Testes e validação

O projeto possui testes automatizados para validar regras operacionais e financeiras.

Para executar os testes da Sprint 5:

```bash
npm run test:sprint5
```

Também foram realizadas validações de:

- Tipagem TypeScript.
- Build de produção.
- Schema do Prisma.
- Conexão e leitura do banco de dados.
- Regras de turnos, cargas e cálculo do rateio.

**Observação:** os testes automatizados e verificações de integração não substituem testes completos de ponta a ponta com autenticação.

## 📅 Organização das Sprints

O desenvolvimento foi dividido em cinco sprints:

| Sprint | Objetivo |
|---|---|
| **Sprint 1** | Cadastros e estrutura inicial do sistema. |
| **Sprint 2** | Gestão de cargas e controle de rejeitos. |
| **Sprint 3** | Registro de turnos e produção dos cooperados. |
| **Sprint 4** | Cálculo do rateio, fechamento mensal e memória de cálculo. |
| **Sprint 5** | Testes, correções, documentação e preparação da entrega. |

## 🔐 Segurança e privacidade

O sistema considera a proteção dos dados dos cooperados e usuários, com controle de acesso por perfil e validações realizadas nas APIs.

O projeto considera os princípios da **Lei Geral de Proteção de Dados (LGPD)**.

## 👨‍💻 Equipe de desenvolvimento

Projeto acadêmico desenvolvido em equipe, com divisão de responsabilidades entre gerenciamento, levantamento de requisitos, banco de dados, qualidade, documentação e desenvolvimento.

---

**EcoCat — Mais transparência, organização e confiança na gestão das cooperativas de reciclagem.**
