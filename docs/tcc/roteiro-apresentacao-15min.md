# Roteiro de apresentação - InventoryRFID

Frase central da defesa: o trabalho valida funcionalmente um protótipo capaz de transformar leituras RFID em evidências para auditoria patrimonial, sem medir desempenho físico do RFID em escala.

Distribuição sugerida: 2 minutos para contexto, problema, proposta e objetivos; 3 minutos para fundamentação, metodologia e arquitetura; 7 minutos para fluxo, processamento, telas e validação; 2 minutos para conclusão, limites e melhorias futuras.

## Slide 1 - Capa

Cumprimentar a banca examinadora, agradecer brevemente pela presença e disponibilidade, apresentar o autor e informar o título do trabalho. Não agradecer nominalmente cada membro, salvo se o protocolo local exigir; o título já define o recorte do TCC.

Fala sugerida: "Bom dia/boa tarde. Inicialmente, cumprimento os membros da banca examinadora e agradeço pela presença e pela disponibilidade em avaliar este trabalho. Eu sou Ezequiel Lobo Oliveira e vou apresentar meu Trabalho de Conclusão de Curso, intitulado 'Sistema de inventário baseado em tecnologia RFID para o Colegiado de Ciência da Computação'."

## Slide 2 - Contexto do trabalho

Situar o controle patrimonial no colegiado. Explicar que o ponto inicial é a necessidade de rastrear a relação entre o registro administrativo e o bem encontrado fisicamente.

Fala sugerida: "Antes de tratar o problema, é importante situar o contexto. O colegiado possui bens distribuídos em laboratórios, salas administrativas e espaços compartilhados. A conferência patrimonial precisa indicar o que deveria estar em cada local e o que foi observado durante a verificação."

## Slide 3 - Problema observado

Mostrar a dificuldade atual de manter registros patrimoniais alinhados à situação real dos bens. Não mencionar RFID, tags, API ou categorias internas do sistema neste ponto.

Fala sugerida: "O problema está na dificuldade de manter os registros patrimoniais atualizados em relação à situação real dos bens no colegiado. Os equipamentos ficam distribuídos entre laboratórios, salas administrativas e espaços compartilhados, e a conferência depende de verificação individual, atualização manual e acompanhamento constante. Nesse contexto, podem surgir divergências entre o que está registrado e o que é encontrado durante a conferência, como bens não localizados ou bens em local diferente do esperado."

## Slide 4 - Proposta do protótipo

Apresentar RFID como apoio à conferência, não como promessa de automação total.

Fala sugerida: "A proposta foi construir um protótipo que integra sistema web, API e eventos RFID. A leitura da tag entra no sistema como evento, e o backend registra histórico, auditoria ou inconsistência conforme o caso."

## Slide 5 - Objetivos do trabalho

Conectar objetivo geral e objetivos específicos ao que foi construído.

Fala sugerida: "O objetivo foi desenvolver e validar funcionalmente um protótipo web de inventário patrimonial com RFID, implementando cadastros, auditoria, histórico, tratamento de inconsistências e o fluxo de leitura até a atualização do inventário."

## Slide 6 - Comparação com trabalhos relacionados

Usar como argumento de banca: RFID identifica, middleware integra, InventoryRFID conecta a leitura ao fluxo de auditoria e resolução de inconsistências.

Fala sugerida: "O diferencial do InventoryRFID é ligar a leitura RFID ao processo patrimonial: a leitura entra como evento, é comparada com o esperado, pode gerar uma inconsistência e permite que a pendência seja analisada e resolvida com registro no histórico."

## Slide 7 - Percurso metodológico

Explicar o caminho sem recitar o capítulo metodológico.

Fala sugerida: "A metodologia seguiu três etapas: compreender o contexto e os trabalhos relacionados, desenvolver a solução com arquitetura, telas e regras, e validar o fluxo em cenários controlados."

## Slide 8 - Tecnologias e materiais

Separar o papel de cada componente.

Fala sugerida: "A interface web permite operar e acompanhar o inventário. A API centraliza processamento e regras. O SQLite apoia a prototipação. A leitura física validada usou leitor de proximidade, uma tag e um comunicador intermediário."

## Slide 9 - Arquitetura do protótipo

Explicar a figura como visão geral da integração.

Fala sugerida: "A arquitetura separa interface, backend, persistência e fontes de eventos RFID. Isso é importante porque o sistema foi projetado para receber eventos, mesmo que a validação física tenha sido feita com um conjunto controlado de hardware."

## Slide 10 - Fluxo RFID e limite experimental

Ponto crítico: separar o que foi validado fisicamente do que é arquitetura ou continuidade.

Fala sugerida: "O caminho validado fisicamente foi tag aproximada do leitor, comunicador, API e auditoria. O caminho com sensor ou gateway aparece como possibilidade arquitetural ou verificação de software, não como validação física completa."

## Slide 11 - Processamento das leituras

Mostrar a inteligência do protótipo.

Fala sugerida: "Depois que a leitura chega à API, o sistema valida tag, leitor, janela ativa e possíveis duplicidades. Em seguida, registra a consequência: histórico, auditoria ou inconsistência."

## Slide 12 - Interface de acompanhamento

Apresentar a tela como resultado operacional.

Fala sugerida: "O painel transforma o processamento em informação acompanhável. Ele reúne indicadores, leitores, pendências e eventos recentes para apoiar a rotina de conferência."

## Slide 13 - Auditoria patrimonial

Conectar diretamente ao objetivo.

Fala sugerida: "A auditoria compara o inventário lógico com o inventário físico formado pelas leituras. Esse é o ponto em que o sistema identifica esperados, lidos, ausentes, divergentes e desconhecidos."

## Slide 14 - Tratamento de inconsistências

Explicar que inconsistência é evidência operacional, não apenas erro.

Fala sugerida: "Quando há divergência, o sistema registra uma pendência para análise ou regularização. Isso permite tratar ausência, local divergente ou tag desconhecida com histórico."

## Slide 15 - Validação funcional

Explicar o significado do 6/6 com cuidado.

Fala sugerida: "Cada cenário foi repetido seis vezes para confirmar o comportamento funcional. O número não representa amostragem estatística; ele confirma que as regras se mantiveram nos cenários controlados."

Evitar: "validado em escala", "desempenho físico comprovado", "leitura simultânea comprovada" ou "sensor físico validado".

## Slide 16 - Conclusão e limites

Fechar com contribuição e delimitação.

Fala sugerida: "A contribuição principal é a integração entre cadastro patrimonial, eventos RFID, API, auditoria, histórico e inconsistências. O limite é que não foram avaliados alcance, leitura simultânea, interferência ambiental ou operação institucional em escala."

## Slide 17 - Melhorias futuras

Encerrar com continuidade, sem transformar possibilidade em resultado validado.

Fala sugerida: "Como trabalhos futuros, o protótipo pode ser ampliado para testes com múltiplas tags e leitores físicos, medição de alcance e interferência, integração real com sensores ou gateways e relatórios mais completos para apoio à decisão patrimonial."

## Slide 18 - Referências principais

Usar como apoio final, sem gastar muito tempo na apresentação oral.

Fala sugerida: "Por fim, estas são as principais referências utilizadas para fundamentar o trabalho, cobrindo inventário com RFID, integração entre dispositivos e sistemas, controle patrimonial e limitações técnicas da leitura RFID."
