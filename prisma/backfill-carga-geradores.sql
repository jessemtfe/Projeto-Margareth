UPDATE tabela_cargas AS carga
INNER JOIN (
  SELECT
    MIN(id_gerador) AS id_gerador,
    BINARY gerador AS gerador_exato
  FROM cadastro_geradores
  GROUP BY BINARY gerador
  HAVING COUNT(*) = 1
) AS gerador_unico
  ON gerador_unico.gerador_exato = BINARY carga.gerador
SET carga.gerador_id = gerador_unico.id_gerador
WHERE carga.gerador_id IS NULL;
