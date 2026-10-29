# EcoCat — Requisitos e escopo do projeto

## Objetivo

O EcoCat apoia a operação de uma cooperativa de reciclagem: cadastro de geradores e cooperados, controle de cargas e rejeitos, registro de turnos e produção, e conferência do rateio mensal.

## Escopo organizado por sprint

Esta documentação descreve o produto completo, da Sprint 1 à Sprint 5. A Sprint 5 é a etapa de estabilização e entrega; ela não substitui nem limita a documentação funcional das sprints anteriores.

| Sprint | Foco | Entregas funcionais/documentais |
|---|---|---|
| 1 — Cadastros e operação inicial | Base operacional da cooperativa | Cadastro e consulta de geradores, cooperados e preços; entrada e identificação de cargas; autenticação, navegação e controle de acesso por perfil. |
| 2 — Fluxo de cargas e rejeitos | Acompanhamento e regras da operação | Ciclo sequencial das cargas, rejeição na entrada, validação de dados e pesagem, histórico de rejeito por gerador, alerta após três cargas consecutivas acima de 25%, central de alertas e ações de manutenção dos cadastros. |
| 3 — Turnos e produção | Registros individuais para cálculo | Entrada e saída de turnos, cálculo de duração, turno aberto, tipo de dia, domingos/feriados em dobro, produção por material e persistência associada ao cooperado. |
| 4 — Rateio e fechamento | Memória financeira e conferência | Prévia mensal, fundo 50/50, elegibilidade por horas, bônus, produção avaliada por material, inconsistências, histórico e fechamento imutável. |
| 5 — Estabilização e entrega | Qualidade e apresentação do projeto completo | Testes de regras das Sprints 1–4, correção de problemas, verificação de build/schema/banco, requisitos consolidados, diagramas, relatório, checklist de evidências e roteiro de apresentação. |

### Sprint 1 — Cadastros e operação inicial

- Manter os cadastros de geradores, cooperados e preços dos materiais.
- Registrar cargas ligadas a um gerador e identificar cada carga individualmente.
- Disponibilizar autenticação e navegação de acordo com os perfis Presidente, Balanceiro e Cooperado.
- Garantir que a autorização também seja aplicada pelas APIs do servidor.

### Sprint 2 — Fluxo de cargas, rejeito e alertas

- Permitir acompanhar o ciclo Recebida → Pesada → Em triagem → Triada → Vendida, sem pular ou retroceder etapas.
- Permitir rejeitar a carga no recebimento e preservar esse registro.
- Validar gerador, material, data, peso e percentual de rejeito; pesos fora da faixa operacional exigem confirmação.
- Manter histórico de cargas e calcular a regra de rejeito pelas três cargas mais recentes de cada gerador.
- Criar alerta somente se as três taxas forem estritamente maiores que 25%; 25% ou menos reinicia a sequência.
- Permitir consultar alertas persistidos e manter cadastros por telas de criação, edição e remoção autorizadas.

### Sprint 3 — Turnos e produção

- Registrar data, entrada, saída e tipo do dia do turno; calcular duração e impedir saída anterior/igual à entrada.
- Identificar domingo pela data; marcar feriados manualmente; ponderar em dobro ambos na parcela de horas.
- Não usar turnos abertos no cálculo.
- Registrar produção positiva em kg por cooperado, material e data, persistindo os dados no banco.
- Preparar os dados e limites de elegibilidade usados pelo rateio: 60 horas reais para a parcela de produção.

### Sprint 4 — Rateio, memória e fechamento

- Avaliar a produção mensal aos preços ativos do material e competência.
- Dividir o fundo avaliado em 50% para horas ponderadas e 50% para produção de cooperados elegíveis.
- Considerar menos de 60 horas como inelegível à parcela de produção e exatamente 60 como elegível.
- Aplicar bônus adicional de 10% da parcela individual de produção somente acima de 180 horas reais.
- Exibir memória individual, valores por material, totais, inconsistências e histórico.
- Bloquear fechamento enquanto houver turno aberto ou inconsistência; preservar o resultado e impedir alterações posteriores da competência fechada.

### Sprint 5 — Estabilização e entrega acadêmica

- Reexecutar testes automatizados e validações técnicas sobre regras de todas as sprints.
- Conferir conectividade ao banco e estado do ambiente publicado sem alterar a base operacional durante verificações de leitura.
- Consolidar requisitos, UML/modelo de dados, relatório de testes, checklist de evidências e roteiro de apresentação.
- Registrar explicitamente o que foi automatizado, o que foi verificado no ambiente público e os cenários E2E que ainda exigem ambiente de demonstração.

## Perfis e permissões

| Perfil | Responsabilidades principais |
|---|---|
| Presidente | Gerenciar usuários, cadastros, preços, alertas, rateio e fechamento mensal. |
| Balanceiro | Consultar geradores e registrar/acompanhar cargas, pesagens e etapas. |
| Cooperado | Registrar seus próprios turnos e produção e consultar suas memórias fechadas. |

O servidor valida permissões nas APIs; a navegação da interface não é a única barreira de acesso.

## Requisitos funcionais

| ID | Requisito | Critério de aceite |
|---|---|---|
| RF-01 | Manter geradores | Presidente cadastra e consulta geradores com tipo e situação. |
| RF-02 | Manter cooperados | Presidente cadastra e consulta cooperados, incluindo seus dados de operação. |
| RF-03 | Manter preços por competência | Presidente registra material, preço/kg, competência e situação; não altera preço de período fechado. |
| RF-04 | Registrar cargas | Balanceiro/Presidente informa gerador, material, data, peso e rejeito; material requer preço ativo. |
| RF-05 | Acompanhar cargas | Carga avança somente para a próxima etapa; carga rejeitada na entrada não avança. |
| RF-06 | Alertar rejeito elevado | Alertar quando as três cargas mais recentes de um gerador tiverem rejeito estritamente acima de 25%. |
| RF-07 | Registrar turnos | Cooperado registra entrada e saída no mesmo dia; turno aberto não tem duração para rateio. |
| RF-08 | Ponderar turnos | Domingo e feriado contam em dobro na parcela de horas; domingo é identificado pela data. |
| RF-09 | Registrar produção | Cooperado registra data, material e quantidade positiva em kg. |
| RF-10 | Calcular prévia mensal | Avaliar produção pelos preços ativos da competência e mostrar parcelas de horas/produção de 50% cada. |
| RF-11 | Aplicar elegibilidade e bônus | Menos de 60 horas reais não recebe parcela de produção; exatamente 60 participa. Mais de 180 horas recebe bônus adicional de 10% da parcela de produção. |
| RF-12 | Apresentar memória | Mostrar horas reais e ponderadas, produção por material e valor, parcelas, bônus e total individual. |
| RF-13 | Fechar rateio | Presidente pode fechar competência sem turno aberto nem inconsistências impeditivas; fechamento preserva os valores e bloqueia alterações nos preços, turnos e produção daquele mês. |
| RF-14 | Consultar histórico | Presidente consulta prévias e períodos fechados; cooperado consulta apenas suas próprias memórias fechadas. |

## Requisitos não funcionais

- Persistir cadastros e registros operacionais em MySQL compatível (TiDB Cloud).
- Aplicar autenticação e autorização no servidor.
- Usar moeda em centavos e distribuir restos de arredondamento de forma determinística.
- Exibir erros de validação sem tratar uma falha como sucesso.
- Manter credenciais fora do Git e usar HTTPS no ambiente publicado.

## Regras de negócio importantes

1. A regra de alerta é `rejeito > 25%`; 25% exatos não satisfazem o limite.
2. A sequência de cargas é por gerador; uma carga recente com rejeito igual ou menor a 25% reinicia a sequência.
3. O fundo do rateio é a produção avaliada aos preços ativos do mês.
4. A parcela de horas considera as horas ponderadas; a elegibilidade da parcela de produção e do bônus considera horas reais.
5. O bônus é adicional à parcela de produção; consequentemente, o total pago pode ultrapassar o fundo disponível pelo montante do bônus.
6. Feriados locais e móveis precisam ser marcados no registro do turno.
7. Uma inconsistência de preço ou turno precisa ser corrigida antes de fechar; não se presume preço zero.

## Fora do escopo da Sprint 5

A Sprint 5 é de estabilização e entrega do sistema descrito nas Sprints 1–4. Não inclui novos módulos de operação, integração financeira/pagamento, calendário automático de feriados ou edição/reabertura de rateio fechado.
