# Fala contínua da apresentação - InventoryRFID

Boa tarde. Inicialmente, cumprimento os membros da banca examinadora e agradeço pela presença e pela disponibilidade em avaliar este trabalho. Eu sou Ezequiel Lobo Oliveira e vou apresentar meu Trabalho de Conclusão de Curso, intitulado "Sistema de inventário baseado em tecnologia RFID para o Colegiado de Ciência da Computação".

Antes de entrar no problema, é importante situar o contexto do trabalho. O controle patrimonial em um colegiado envolve bens distribuídos entre laboratórios, salas administrativas e espaços compartilhados. Nessa rotina, a conferência precisa relacionar o que está registrado administrativamente com aquilo que é encontrado fisicamente no ambiente. Portanto, a rastreabilidade entre registro, localização esperada, leitura observada e histórico de auditoria é um ponto central para organizar o inventário.

O problema está na dificuldade de manter os registros patrimoniais atualizados em relação à situação real dos bens no colegiado. Os equipamentos ficam distribuídos entre laboratórios, salas administrativas e espaços compartilhados, e a conferência depende de verificação individual, atualização manual e acompanhamento constante. Nesse contexto, podem surgir divergências entre o que está registrado e o que é encontrado durante a conferência, como bens não localizados ou bens em local diferente do esperado.

A proposta deste trabalho foi construir um protótipo que integra sistema web, API e eventos RFID. A ideia não é vender RFID como solução automática para todos os problemas de inventário, mas usá-lo como apoio à conferência. No protótipo, locais, leitores, bens e tags formam a base do inventário lógico. A leitura da tag chega ao backend por meio de um comunicador intermediário e o sistema registra histórico, auditoria ou inconsistência conforme o resultado encontrado.

Com isso, o objetivo geral foi desenvolver e validar funcionalmente um protótipo web de inventário patrimonial baseado em RFID. Para alcançar esse objetivo, foram implementados cadastros, consulta, auditoria, histórico e tratamento de inconsistências. Também foi projetada uma arquitetura modular para receber eventos RFID e verificar o fluxo de leitura, processamento e atualização do inventário em ambiente controlado.

Na fundamentação, os trabalhos relacionados ajudam a sustentar três pontos. O primeiro é o uso de RFID como tecnologia de identificação automática e apoio à rastreabilidade. O segundo é a integração de dispositivos e sistemas por meio de eventos, middleware ou APIs. O diferencial deste protótipo está em aplicar essas bases ao fluxo de auditoria patrimonial. A leitura RFID não é usada apenas para identificar um item; ela entra como evento, é comparada com o esperado, pode gerar uma inconsistência e permite que essa pendência seja analisada e resolvida com registro no histórico operacional.

A metodologia foi organizada em três etapas. Primeiro, foi feita a compreensão do contexto, com revisão sobre controle patrimonial, RFID, integração e trabalhos relacionados. Depois, ocorreu o desenvolvimento da solução, envolvendo modelagem, arquitetura, telas, API e regras de processamento das leituras. Por fim, foi feita a validação funcional do fluxo em cenários controlados, com leitor de proximidade, uma tag física, comunicador intermediário e API.

Em relação às tecnologias e materiais, o protótipo combina uma interface web para operação e acompanhamento, um backend com API REST para autenticação, cadastros, eventos, auditoria e inconsistências, e um banco SQLite local para prototipação. A parte física validada utilizou leitor RFID de proximidade com uma tag, além de um comunicador responsável por enviar a leitura ao backend no formato esperado.

A arquitetura separa a interface, o backend, as regras de negócio, a persistência e as fontes de eventos RFID. Essa separação é importante porque deixa claro onde a leitura entra, onde as regras são aplicadas e onde os resultados ficam armazenados. O ponto central da arquitetura é o processamento do evento que chega ao sistema, e não o modelo específico do leitor utilizado no experimento.

No fluxo RFID, há uma distinção importante para a defesa. O caminho validado fisicamente foi composto pela aproximação da tag ao leitor, envio pelo comunicador, processamento pela API e registro do resultado na auditoria. Já o caminho com sensor ou gateway deve ser entendido como possibilidade arquitetural ou fluxo verificado por software, não como validação física completa. Essa distinção evita ampliar a evidência além do que foi efetivamente testado.

Depois que a leitura chega à API, o sistema interpreta o evento. Ele valida a tag, o leitor, a janela ativa e possíveis duplicidades. Em seguida, registra a consequência adequada. Dependendo do caso, essa consequência pode ser atualização de histórico, confirmação em auditoria ou abertura de inconsistência para análise posterior.

Na interface de acompanhamento, o processamento passa a ser visível para o usuário. O painel reúne indicadores, leitores, pendências e eventos recentes do inventário. Ele funciona como uma visão operacional para acompanhar a situação geral antes de entrar nas telas específicas de auditoria e inconsistências.

A auditoria patrimonial é o ponto mais diretamente ligado ao objetivo do trabalho. Nessa etapa, o sistema compara o inventário lógico com o inventário físico formado pelas leituras. Assim, a leitura RFID deixa de ser apenas um código capturado e passa a gerar uma evidência para classificar itens esperados, lidos, ausentes, divergentes ou desconhecidos.

Quando essa comparação aponta diferença entre o esperado e o observado, o sistema registra uma inconsistência. Essa inconsistência não é apenas um erro técnico; ela é uma informação operacional que precisa ser analisada ou regularizada. Com isso, situações como bem ausente, local divergente ou tag desconhecida podem ser acompanhadas com histórico.

A validação funcional foi feita em cenários controlados. Cada cenário foi repetido seis vezes para confirmar o comportamento do sistema. Esse número não deve ser interpretado como amostragem estatística, mas como repetição funcional para verificar se as regras se mantinham. Entre os cenários avaliados estão leitura conhecida, correção de pendência, tag desconhecida, local divergente, leitura repetida e leitor sem resposta.

O foco da validação não foi medir desempenho físico do RFID, como alcance, leitura simultânea de múltiplas tags, interferência ambiental ou operação institucional em escala. O foco foi verificar se o software recebe os eventos, processa as leituras e registra corretamente histórico, auditoria e inconsistências.

Como conclusão, o protótipo cumpre o objetivo funcional proposto. Ele integra cadastro patrimonial, eventos RFID, API, auditoria, histórico e tratamento de inconsistências. A contribuição principal é transformar leituras RFID em evidências rastreáveis para apoiar auditoria patrimonial, comparando o inventário esperado com aquilo que foi observado no fluxo de conferência.

Ao mesmo tempo, os limites permanecem explícitos. A validação física ficou restrita ao leitor de proximidade, uma tag, um comunicador intermediário e a API. Não foram avaliados alcance, leitura simultânea, interferência ambiental nem implantação real com múltiplos leitores físicos.

Como melhorias futuras, o protótipo pode ser ampliado em quatro frentes. A primeira é testar múltiplas tags e leitores RFID físicos em ambientes reais do colegiado. A segunda é medir alcance, leitura simultânea, interferência ambiental e taxa de leitura. A terceira é integrar sensores ou gateways físicos ao fluxo de eventos previsto na arquitetura. A quarta é ampliar relatórios, filtros e trilhas de auditoria para apoiar melhor a decisão patrimonial.

Por fim, estas são as principais referências utilizadas para fundamentar o trabalho, incluindo inventário com RFID, integração entre dispositivos e sistemas, controle patrimonial e limitações técnicas da leitura RFID.

Com isso, encerro a apresentação e fico à disposição para as perguntas.
