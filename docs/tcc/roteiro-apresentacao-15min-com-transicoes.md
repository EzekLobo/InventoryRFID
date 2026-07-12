# Roteiro de apresentacao - modelo atual dos slides

## Ideia central

O trabalho valida funcionalmente um prototipo que transforma eventos RFID em
informacoes rastreaveis para apoiar a auditoria patrimonial, respeitando o
limite de validacao fisica: leitor RFID USB/de proximidade, uma tag,
comunicador intermediario e API.

## Distribuicao de tempo

- Slide 1: abertura - 30s.
- Slide 2: contextualizacao e problema - 1min40s.
- Slides 3 e 4: solucao proposta e objetivos - 2min.
- Slides 5 e 6: trabalhos relacionados e metodologia - 2min.
- Slide 7: arquitetura e tecnologias - 1min20s.
- Slide 8: demonstracao do deploy - 3min30s.
- Slides 9 e 10: resultados, limitacoes, conclusao e futuros - 3min.
- Slides 11 e 12: referencias e encerramento - 30s.
- Margem tecnica: cerca de 30s a 1min.

## Slide 1 - Capa

Boa tarde. Eu sou Ezequiel Lobo Oliveira e vou apresentar o trabalho "Sistema de
inventario baseado em tecnologia RFID para o Colegiado de Ciencia da
Computacao", desenvolvido sob orientacao do professor Jorge Lima de Oliveira
Filho, no Bacharelado em Ciencia da Computacao da UESC.

Transicao: Antes de falar da solucao, eu comeco situando o contexto e o problema
que motivaram o desenvolvimento do prototipo.

## Slide 2 - Contextualizacao

O trabalho parte do controle patrimonial no colegiado. Quando falo em patrimônio, estou me referindo aos bens físicos pertencentes ou sob responsabilidade do colegiado, como computadores, projetores, bancadas e outros equipamentos distribuídos entre laboratórios, salas administrativas e espaços compartilhados.

Para que haja controle e auditoria desses bens, é necessário realizar o processo de inventário, que relaciona o que está registrado administrativamente com aquilo que é encontrado fisicamente no ambiente.

À primeira vista, parece um processo simples. Porém, quando esse inventário depende de uma conferência manual e unitária dos códigos, feita visualmente para atualizar a situação de cada item, ele tende a consumir mais tempo e fica mais suscetível a falhas humanas, como erro de anotação, esquecimento de registro ou dificuldade de acompanhar divergências.

Transicao: A partir desse problema, a proposta do trabalho foi usar RFID como
apoio a conferencia, sem tratar a tecnologia como uma automacao completa do
inventario.

## Slide 3 - Solucao proposta

Diante desse problema, a solução proposta foi usar RFID para auxiliar a conferência dos bens durante o inventário. Em vez de depender apenas da leitura visual dos códigos patrimoniais, o sistema passa a receber a identificação da tag RFID e usa essa informação para registrar a presença do bem, apoiar a auditoria e indicar possíveis divergências.

## Slide 4 - Objetivos do trabalho

O objetivo geral foi desenvolver um protótipo funcional de software para inventário patrimonial baseado em RFID, no contexto do Colegiado de Ciência da Computação da UESC. A proposta foi integrar a leitura RFID ao sistema para apoiar o cadastro, a auditoria, o histórico e o tratamento de inconsistências patrimoniais.

O objetivo geral foi desenvolver um prototipo web para inventario patrimonial
baseado em RFID, voltado ao apoio da auditoria patrimonial no Colegiado de
Ciencia da Computacao da UESC.

Os objetivos especificos passam por pesquisar requisitos essenciais, projetar uma
arquitetura modular, construir o prototipo web funcional, integrar a leitura RFID
com a API e validar o fluxo funcional do sistema.

Transicao: Esses objetivos se apoiam em trabalhos relacionados que discutem RFID
em inventario, integracao com sistemas e limites fisicos da tecnologia.

## Slide 5 - Trabalhos relacionados

A literatura ajudou a sustentar tres pontos. Primeiro, o uso de RFID como
tecnologia de identificacao automatica de bens. Segundo, o papel de middleware,
IoT e APIs na integracao de eventos a sistemas. Terceiro, a necessidade de
cautela na avaliacao fisica da tecnologia RFID.

O diferencial do InventoryRFID e que a leitura RFID nao fica restrita a
identificacao. Ela alimenta auditoria patrimonial, registro operacional,
resolucao de inconsistencias e historico.

Transicao: A partir dessa base teorica, a pesquisa seguiu um percurso
metodologico em tres etapas.

## Slide 6 - Percurso metodologico

O percurso metodologico comecou pela compreensao do contexto, com revisao sobre
controle patrimonial, RFID, integracao e trabalhos relacionados.

Depois ocorreu o desenvolvimento do prototipo, envolvendo modelagem,
arquitetura, telas, API e regras de processamento das leituras.

Por fim, foi feita a validacao funcional do fluxo, em cenarios controlados, com
leitor de proximidade, uma tag fisica, comunicador intermediario e API.

Transicao: Depois da metodologia, a arquitetura mostra como essas partes foram
organizadas no prototipo.

## Slide 7 - Arquitetura e tecnologias

A aplicacao combina interface web, API REST, banco local e middleware RFID. A
interface foi desenvolvida com Next.js e React. O backend usa Django e Django
REST Framework. A persistencia local foi feita com SQLite, adequado ao carater
de prototipo.

O middleware RFID atua como ponte entre a leitura fisica e a API. Essa separacao
e importante porque deixa claro onde a leitura entra, onde as regras sao
processadas e onde os resultados ficam registrados.

Transicao: Com essa arquitetura apresentada, eu passo para a demonstracao do
deploy, mostrando como o fluxo aparece na interface.

## Slide 8 - Demonstracao do prototipo

Na demonstracao, o foco e mostrar como uma leitura deixa de ser apenas um codigo
capturado e se transforma em informacao operacional para auditoria patrimonial.

Sequencia sugerida para a demo:

1. Abrir o deploy: https://inventory-rfid.vercel.app/
2. Mostrar o painel inicial e situar os indicadores principais.
3. Mostrar leitores, eventos recentes ou pendencias, sem gastar tempo em todos
   os detalhes da tela.
4. Entrar na auditoria e explicar a comparacao entre inventario logico e
   inventario observado.
5. Abrir inconsistencias e destacar exemplos como tag desconhecida, local
   divergente ou item ausente.

Fala de fechamento da demo: Essa demonstracao resume o papel do prototipo. A
leitura RFID entra como evento, o sistema aplica as regras e o resultado fica
rastreavel para auditoria, historico ou tratamento de inconsistencia.

Transicao: Depois de mostrar o sistema em execucao, eu volto aos resultados da
validacao funcional e aos limites do experimento.

## Slide 9 - Resultados e limitacoes

A avaliacao foi feita em cenario controlado. O prototipo operou com leitor RFID
USB/de proximidade, uma tag fisica, comunicador intermediario e API. A validacao
verificou captura, envio, processamento, classificacao e registro dos eventos
RFID.

Os cenarios tiveram execucao 6/6, indicando repeticao funcional do comportamento
esperado. Isso inclui leitura RFID real, processamento do evento, comparacao
entre inventario logico e fisico, registro operacional, resolucao de
inconsistencias e tratamento de excecoes.

E importante destacar que esse numero nao representa uma avaliacao estatistica
nem desempenho fisico em escala. O trabalho nao mediu alcance, leitura
simultanea de muitas tags, interferencia ambiental ou operacao institucional com
multiplos leitores fisicos.

Transicao: Com esses resultados e limites claros, a conclusao sintetiza a
contribuicao do prototipo e aponta continuidades possiveis.

## Slide 10 - Conclusao e trabalhos futuros

Como conclusao, o sistema transforma eventos RFID em informacoes rastreaveis
para apoiar o controle patrimonial. O prototipo atingiu os objetivos definidos,
demonstrou viabilidade funcional e integrou interface, backend e persistencia
para apoiar a auditoria patrimonial.

Como trabalhos futuros, ficam testes com multiplas tags, leitores de maior
alcance, integracao fisica com gateways ou sensores, alem de relatorios e
metricas de auditoria mais completas.

Transicao: Para finalizar, apresento as principais referencias usadas para
fundamentar o trabalho.

## Slide 11 - Referencias

Estas sao as principais referencias que sustentaram a discussao sobre RFID,
inventario automatizado, gestao patrimonial, IoT, middleware e limitacoes
tecnicas de instalacoes RFID.

Transicao: Com isso, eu encerro a apresentacao.

## Slide 12 - Obrigado

Obrigado pela atencao. Fico a disposicao para duvidas e contribuicoes.

## Dicas para treinar sem ficar engessado

- Decore principalmente as transicoes, nao o texto inteiro.
- No slide 2, explique patrimonio e inventario com naturalidade, porque isso
  ajuda a banca a entrar no problema.
- Na demo, evite narrar cada clique. Mostre o fluxo: painel, auditoria,
  inconsistencias e rastreabilidade.
- Se a demo atrasar, pule detalhes da tela e preserve o slide 9, porque ele
  delimita os resultados e evita promessa alem da evidencia.
- Se o tempo apertar, resuma os trabalhos relacionados em uma unica frase e siga
  para metodologia.
