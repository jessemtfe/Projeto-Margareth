# EcoCat — Requisitos e escopo

## Objetivo

O EcoCat apoia a operação de uma cooperativa de reciclagem: cadastro de geradores e cooperados, controle de cargas e rejeitos, registro de turnos e produção, e conferência do rateio mensal.

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

## Fora do escopo de Sprint 5

Sprint 5 é de estabilização e entrega. Não inclui novos módulos de operação, integração financeira/pagamento, calendário automático de feriados ou edição/reabertura de rateio fechado.
