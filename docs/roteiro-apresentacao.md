# EcoCat — Roteiro de apresentação

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

1. **Contexto e objetivo (1 min):** explicar que o EcoCat acompanha materiais, cargas, turnos e rateio da cooperativa.
2. **Perfis e cadastros (1 min):** mostrar a navegação conforme o perfil e localizar geradores/cooperados.
3. **Preço e entrada de carga (1–2 min):** mostrar um preço ativo e avançar uma carga uma etapa; explicar que não é possível pular etapas.
4. **Regra de rejeito (1 min):** abrir o alerta do gerador com três cargas consecutivas acima de 25%; explicar que 25% exatos não contam.
5. **Registros do cooperado (1 min):** mostrar turno aberto/encerrado, horas e produção por material.
6. **Prévia do rateio (2 min):** selecionar competência e percorrer produção avaliada, horas reais/ponderadas, parcela de horas, parcela de produção e bônus.
7. **Validação e fechamento (1 min):** demonstrar bloqueio por inconsistência em competência de teste; em seguida apresentar fechamento já preparado em competência descartável ou no ambiente de demonstração.
8. **Memória e persistência (1 min):** abrir a memória individual e recarregar para mostrar dados persistidos.
9. **Encerramento:** resumir regras, cuidados com dados e próximos passos.

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
