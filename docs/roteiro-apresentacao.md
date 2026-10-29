# EcoCat — Roteiro de apresentação do projeto completo

## Preparação

- Confirmar deploy saudável em `https://ecocat.vercel.app` e autenticação por perfil.
- Usar banco de demonstração, com dados fictícios pré-carregados; não inserir dados de apresentação no banco operacional.
- Preparar uma conta Presidente, uma conta Balanceiro e uma conta Cooperado, com permissões verificadas.
- Escolher uma competência ainda aberta, com preço ativo para cada material de produção.
- Preparar três cargas recentes do mesmo gerador com rejeitos acima de 25%, além de um caso com 25% para demonstrar o limite estrito.
- Preparar turnos de cooperados com menos de 60 h, exatamente 60 h, exatamente 180 h e mais de 180 h; marcar domingo/feriado quando aplicável.
- Confirmar que os cooperados elegíveis têm produção na competência e que os valores da memória foram conferidos.
- Evitar compartilhar credenciais ou exibir configurações administrativas/segredos durante a apresentação.

## Sequência sugerida (7–10 minutos)

1. **Contexto do projeto (1 min):** objetivo, problema atendido e visão das cinco sprints.
2. **Sprint 1 — Base operacional (1 min):** apresentar perfis e cadastros de geradores, cooperados e preços.
3. **Sprint 2 — Cargas e alertas (2 min):** registrar/acompanhar carga, mostrar transição de status e alerta de três rejeitos acima de 25%.
4. **Sprint 3 — Registros do cooperado (1 min):** mostrar entrada/saída de turno, domingo/feriado e produção por material.
5. **Sprint 4 — Rateio mensal (2–3 min):** selecionar competência e percorrer produção avaliada, horas reais/ponderadas, parcela de horas, parcela de produção e bônus.
6. **Sprint 4 — Fechamento e memória (1 min):** demonstrar bloqueio por inconsistência em ambiente de teste, memória fechada preparada e persistência após atualizar.
7. **Sprint 5 — Qualidade e entrega (1 min):** apresentar testes automatizados, documentação e limites dos testes E2E.
8. **Encerramento:** resumir regras de negócio, arquitetura e cuidados com dados.

## Falas-chave para o rateio

- O fundo mensal é a produção avaliada pelo preço ativo de cada material na competência.
- O fundo é dividido igualmente entre horas ponderadas e produção; domingos e feriados dobram somente o peso de horas.
- A partir de 60 horas reais, o cooperado participa da parcela de produção.
- O bônus adicional de 10% só ocorre acima de 180 horas reais; não é descontado dos demais.
- Turnos abertos e inconsistências de preço bloqueiam o fechamento.

## Plano de contingência

- Se o ambiente público estiver indisponível, apresentar build local apenas como contingência e informar claramente que não é o site publicado.
- Se a conta de demonstração não autenticar, não improvisar com credenciais pessoais; usar as evidências capturadas conforme o checklist.
- Se dados de teste não estiverem preparados, explicar o cenário com o relatório e não modificar a base compartilhada ao vivo.
