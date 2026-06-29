# Fala enxuta da apresentação - InventoryRFID

## Tempo alvo

- 10 slides.
- Cerca de 10 a 12 minutos de fala.
- Deixe 2 a 4 minutos para demonstração curta ou margem de segurança.

## Roteiro

### Slide 1 - Abertura

Boa tarde. Eu sou Ezequiel Lobo Oliveira e vou apresentar o trabalho "Sistema de inventário baseado em tecnologia RFID para o Colegiado de Ciência da Computação", desenvolvido sob orientação do professor Jorge Lima.

### Slide 2 - Problema

O ponto central do trabalho é a dificuldade de manter o registro patrimonial alinhado com a situação real dos bens. Em um colegiado, os equipamentos ficam distribuídos em diferentes ambientes, e a conferência manual depende de verificação individual. Quando um bem não é encontrado ou aparece em local diferente, essa divergência precisa ser registrada de forma rastreável.

### Slide 3 - Proposta

A proposta foi construir um protótipo que integra sistema web, API e eventos RFID. O RFID entra como apoio à conferência: a tag é lida, o comunicador envia o evento para a API e o sistema registra histórico, auditoria ou inconsistência conforme o caso.

### Slide 4 - Objetivos

O objetivo geral foi desenvolver e validar funcionalmente um protótipo web de inventário patrimonial com RFID. Para isso, foram implementados cadastros, consulta, auditoria, histórico e inconsistências, além de uma arquitetura modular para receber e processar eventos RFID.

### Slide 5 - Metodologia

A metodologia foi organizada em três etapas: compreensão do contexto e revisão, desenvolvimento do protótipo e validação funcional. A validação foi feita em cenário controlado, com leitor RFID de proximidade, uma tag física, comunicador intermediário e API.

### Slide 6 - Fluxo e limite experimental

Este slide é importante porque separa o que foi validado fisicamente do que fica como expansão. A validação física envolveu aproximar a tag do leitor, enviar o evento pelo comunicador, processar na API e registrar o resultado na auditoria. Já sensor, gateway e leitores em rede aparecem como caminho arquitetural ou verificação de software, não como validação física completa.

### Slide 7 - Demonstração

Aqui eu apresento rapidamente o protótipo no deploy, passando pelo painel, auditoria e inconsistências. O foco da demonstração é mostrar como a leitura vira informação operacional no sistema.

### Slide 8 - Validação funcional

A validação funcional foi organizada em cenários. Cada cenário foi repetido seis vezes, sem caráter estatístico, mas para confirmar o comportamento do fluxo. Foram avaliados casos como leitura conhecida, correção de pendência, tag desconhecida, local divergente, leitura repetida e leitor sem resposta.

### Slide 9 - Conclusão

Como conclusão, o protótipo atingiu o objetivo funcional proposto. Ele integra cadastro patrimonial, eventos RFID, API, auditoria, histórico e tratamento de inconsistências. A principal contribuição foi transformar leituras RFID em informações rastreáveis para apoiar a auditoria patrimonial.

Também é importante manter o limite claro: a validação física ficou restrita ao leitor de proximidade, uma tag, comunicador e API. Como trabalhos futuros, ficam testes com múltiplas tags, leitores de maior alcance, gateways ou sensores físicos e relatórios mais completos.

### Slide 10 - Encerramento

Com isso, encerro a apresentação e fico à disposição para perguntas.
