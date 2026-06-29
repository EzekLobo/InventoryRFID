import path from "node:path";

const ROOT = path.resolve(".");
const img = (relativePath) => path.join(ROOT, relativePath);

const COLORS = {
  bg: "#F7F9FB",
  ink: "#17202A",
  muted: "#51606F",
  blue: "#0A4265",
  blueSoft: "#DCEAF2",
  blueMid: "#7EA0B4",
  green: "#0E7A4F",
  greenDark: "#075D3B",
  gold: "#D8A21B",
  line: "#D7DEE6",
  white: "#FFFFFF",
  softGreen: "#E7F4EE",
  softGold: "#FFF4CF",
  softBlue: "#EAF1FB",
};

const ASSETS = {
  brasao: img("docs/tcc/figs/brasao_uesc_transparente.png"),
  casosUso: img("docs/tcc/figs/casos_uso_rfid.png"),
  fluxo: img("docs/tcc/figs/fluxo_atividade_rfid.png"),
  arquitetura: img("outputs/manual-inventoryrfid-slides/presentations/inventoryrfid-tcc/assets/arquitetura_geral_rfid.png"),
  dashboard: img("docs/tcc/figs/sistema/sistema-dashboard.png"),
  dashboardRecorte: img("docs/tcc/figs/sistema/sistema-dashboard-recorte.png"),
  itens: img("docs/tcc/figs/sistema/sistema-itens.png"),
  auditoria: img("docs/tcc/figs/sistema/sistema-auditoria.png"),
  auditoriaRecorte: img("docs/tcc/figs/sistema/sistema-auditoria-recorte.png"),
  inconsistencias: img("docs/tcc/figs/sistema/sistema-inconsistencias.png"),
  inconsistenciasRecorte: img("docs/tcc/figs/sistema/sistema-inconsistencias-recorte.png"),
  log: img("docs/tcc/figs/sistema/sistema-log.png"),
};

const slides = [
  {
    kind: "cover",
    section: "TCC",
    title: "Sistema de inventário baseado em tecnologia RFID para o Colegiado de Ciência da Computação",
    subtitle: "",
    meta: ["Ezequiel Lobo Oliveira", "Orientador: Jorge Lima de Oliveira Filho", "UESC · 2026"],
  },
  {
    section: "INTRODUÇÃO",
    title: "Contexto do trabalho",
    description: "O controle patrimonial no colegiado exige rastreabilidade entre registros administrativos e bens fisicamente encontrados.",
    bullets: [
      "Equipamentos ficam distribuídos entre laboratórios, salas administrativas e espaços compartilhados.",
      "A conferência patrimonial precisa indicar onde o bem deveria estar e o que foi observado no ambiente.",
      "Essa relação exige organização para apoiar inventário, auditoria e acompanhamento patrimonial.",
    ],
    proof: [
      ["Registro administrativo", "informação esperada sobre o bem"],
      ["Conferência física", "situação observada no ambiente"],
      ["Rastreabilidade", "histórico para análise patrimonial"],
    ],
  },
  {
    section: "PROBLEMA",
    title: "Problema observado",
    description: "A dificuldade central está em manter os registros patrimoniais alinhados à situação real dos bens.",
    bullets: [
      "A conferência visual ou manual depende de verificação individual e atualização constante.",
      "Bens podem não ser localizados ou aparecer em local diferente do registrado.",
      "Sem tratamento organizado, essas divergências dificultam a conferência e a tomada de decisão patrimonial.",
    ],
    proof: [
      ["Registro", "informação administrativa do bem"],
      ["Localização", "situação observada na conferência"],
      ["Divergência", "diferença a ser analisada"],
    ],
  },
  {
    section: "PROPOSTA",
    title: "Proposta do protótipo",
    description: "O protótipo integra sistema web, API e eventos RFID para apoiar a auditoria patrimonial.",
    bullets: [
      "Locais, leitores, bens e tags formam a base do inventário lógico.",
      "O leitor de proximidade envia a tag ao sistema por meio de um comunicador intermediário.",
      "A API processa o evento e registra histórico, auditoria ou inconsistência conforme o caso.",
    ],
    proof: [
      ["Sistema web", "cadastro e acompanhamento"],
      ["API REST", "entrada padronizada de eventos"],
      ["RFID", "evidência física em cenário controlado"],
    ],
  },
  {
    section: "OBJETIVOS",
    title: "Objetivos do trabalho",
    description: "Desenvolver e validar funcionalmente um protótipo web de inventário patrimonial baseado em RFID.",
    bullets: [
      "Implementar cadastros, consulta, auditoria, histórico e tratamento de inconsistências.",
      "Projetar uma arquitetura modular para receber e processar eventos RFID.",
      "Verificar o fluxo de leitura, processamento e atualização do inventário em ambiente controlado.",
    ],
    callouts: [
      { value: "Construir", label: "protótipo web funcional" },
      { value: "Integrar", label: "leitura RFID e API" },
      { value: "Validar", label: "fluxo funcional do sistema" },
    ],
  },
  {
    section: "TRABALHOS RELACIONADOS",
    title: "Comparação com trabalhos relacionados",
    description: "A literatura sustenta RFID, integração com sistemas e cautela na avaliação física da tecnologia.",
    comparison: [
      ["RFID em inventário", "identificação automática de bens"],
      ["Middleware e IoT", "integração de eventos a sistemas"],
      ["InventoryRFID", "auditoria e resolução de inconsistências"],
    ],
  },
  {
    section: "METODOLOGIA",
    title: "Percurso metodológico",
    description: "A pesquisa foi organizada para sair do problema patrimonial, construir o protótipo e verificar o fluxo implementado.",
    steps: [
      ["1", "Entender o contexto", "Revisão sobre controle patrimonial, RFID, integração e trabalhos relacionados."],
      ["2", "Desenvolver a solução", "Modelagem, arquitetura, telas, API e regras de processamento das leituras."],
      ["3", "Validar o fluxo", "Cenários controlados com leitor de proximidade, uma tag, comunicador e API."],
    ],
  },
  {
    section: "ARQUITETURA",
    title: "Arquitetura e tecnologias",
    description: "A aplicação combina interface web, API REST, banco local e middleware para processar eventos RFID.",
    image: ASSETS.arquitetura,
    caption: "Diagrama da arquitetura e tecnologias usadas no protótipo.",
    techBadges: [
      ["Next.js", "interface web"],
      ["React", "componentes da UI"],
      ["Django", "backend e regras"],
      ["DRF", "API REST"],
      ["SQLite", "persistência local"],
      ["RFID", "eventos de leitura"],
    ],
  },
  {
    section: "FLUXO RFID",
    title: "Fluxo RFID e limite experimental",
    description: "O slide separa o que foi validado fisicamente do que permanece como caminho escalável da arquitetura.",
    flowLanes: [
      {
        title: "Validado fisicamente",
        accent: COLORS.green,
        steps: ["Tag aproximada do leitor", "Comunicador envia evento", "API processa a leitura", "Auditoria registra resultado"],
        note: "Leitor de proximidade, uma tag, comunicador intermediário e API.",
      },
      {
        title: "Previsto ou verificado por software",
        accent: COLORS.gold,
        steps: ["Sensor ou gateway aciona", "Sistema abre janela", "Leitor envia tags", "Backend processa evento"],
        note: "Fluxo arquitetural para expansão, sem validação física completa.",
      },
    ],
  },
  {
    kind: "demo",
    section: "DEMONSTRAÇÃO",
    title: "Demostração do protótipo",
    description: "Vídeo demonstrativo das interfaces principais no deploy da aplicação.",
    url: "https://inventory-rfid.vercel.app/",
  },
  {
    section: "RESULTADOS",
    title: "Validação funcional",
    description: "Cada cenário foi repetido seis vezes para confirmar o comportamento funcional, sem caráter estatístico.",
    validation: [
      ["Leitura conhecida", "6/6", "item detectado e itens ausentes classificados"],
      ["Correção de pendência", "6/6", "problema encerrado com registro no histórico"],
      ["Tag desconhecida", "6/6", "problema registrado para análise"],
      ["Local divergente", "6/6", "bem marcado fora do local esperado"],
      ["Leitura repetida", "6/6", "repetições tratadas sem duplicar o resultado"],
      ["Leitor sem resposta", "6/6", "falha sinalizada para o usuário"],
    ],
  },
  {
    section: "CONCLUSÃO",
    title: "Conclusão e trabalhos futuros",
    description: "Síntese dos resultados alcançados e continuidade da pesquisa.",
    conclusionBlocks: [
      {
        title: "Conclusão",
        body: [
          "O protótipo atingiu os objetivos propostos.",
          "Demonstrou a viabilidade funcional do sistema de inventário baseado em RFID.",
          "A arquitetura permitiu integrar interface, backend e persistência para apoiar a auditoria patrimonial.",
        ],
      },
      {
        title: "Trabalhos futuros",
        body: [
          "Testes com múltiplas tags.",
          "Leitores de maior alcance.",
          "Integração com gateways/sensores.",
          "Relatórios e métricas de auditoria.",
        ],
      },
    ],
  },
  {
    kind: "refs",
    section: "REFERÊNCIAS",
    title: "Referências principais",
    bullets: [
      "ALWADI et al. RFID smart inventory management system: A survey.",
      "ABIJÁUDE et al. Plataforma InventoryIoT para inventário automatizado.",
      "BRITO et al. Etiquetas inteligentes na gestão patrimonial pública.",
      "MASHAYEKHY et al. Impact of Internet of Things on inventory management.",
      "TING et al. A framework for RFID implementation in inventory management.",
      "KNAPP; WANG. Interference in RFID installations.",
      "Tribunal de Contas do Estado da Bahia. Orientações para controle patrimonial.",
    ],
  },
  {
    kind: "thanks",
    section: "ENCERRAMENTO",
    title: "Obrigado",
    subtitle: "Dúvidas e contribuições",
    author: "Ezequiel Lobo Oliveira",
  },
];

function base(slide, ctx, section, page) {
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill: COLORS.bg });
  ctx.addShape(slide, { x: 0, y: 0, w: 18, h: ctx.H, fill: COLORS.green });
  ctx.addText(slide, {
    text: String(page).padStart(2, "0"),
    x: 1190,
    y: 650,
    w: 44,
    h: 28,
    fontSize: 18,
    color: COLORS.muted,
    typeface: "Arial",
    align: "right",
  });
}

function title(slide, ctx, text, y = 58, width = 1080) {
  ctx.addText(slide, {
    text,
    x: 76,
    y,
    w: width,
    h: 110,
    fontSize: 37,
    color: COLORS.ink,
    bold: true,
    typeface: "Arial",
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

function description(slide, ctx, text) {
  if (!text) return;
  ctx.addText(slide, {
    text,
    x: 78,
    y: 126,
    w: 980,
    h: 46,
    fontSize: 20,
    color: COLORS.muted,
    typeface: "Arial",
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

function bulletList(slide, ctx, bullets, x = 84, y = 244, w = 520, gap = 92) {
  bullets.forEach((item, index) => {
    const top = y + index * gap;
    ctx.addShape(slide, { x, y: top + 8, w: 14, h: 14, fill: COLORS.green, geometry: "ellipse" });
    ctx.addText(slide, {
      text: item,
      x: x + 28,
      y: top,
      w,
      h: 64,
      fontSize: 23,
      color: COLORS.ink,
      typeface: "Arial",
      insets: { left: 0, right: 0, top: 0, bottom: 0 },
    });
  });
}

function calloutRail(slide, ctx, callouts) {
  callouts.forEach((item, index) => {
    const y = 250 + index * 112;
    ctx.addShape(slide, { x: 720, y, w: 408, h: 82, fill: index === 1 ? COLORS.softGold : COLORS.white, line: ctx.line(COLORS.line, 1) });
    ctx.addText(slide, { text: item.value, x: 746, y: y + 10, w: 330, h: 34, fontSize: 30, color: COLORS.greenDark, bold: true, typeface: "Arial" });
    ctx.addText(slide, { text: item.label, x: 746, y: y + 48, w: 340, h: 24, fontSize: 19, color: COLORS.muted, typeface: "Arial" });
  });
}

function proofCards(slide, ctx, proof) {
  proof.forEach((item, index) => {
    const y = 252 + index * 104;
    ctx.addShape(slide, { x: 718, y, w: 420, h: 76, fill: COLORS.white, line: ctx.line(COLORS.line, 1) });
    ctx.addText(slide, { text: item[0], x: 744, y: y + 11, w: 360, h: 28, fontSize: 23, color: COLORS.greenDark, bold: true, typeface: "Arial" });
    ctx.addText(slide, { text: item[1], x: 744, y: y + 43, w: 350, h: 24, fontSize: 18, color: COLORS.muted, typeface: "Arial" });
  });
}

function steps(slide, ctx, data) {
  data.forEach((item, index) => {
    const x = 92 + index * 374;
    ctx.addShape(slide, { x, y: 274, w: 312, h: 288, fill: COLORS.white, line: ctx.line(COLORS.line, 1) });
    ctx.addShape(slide, { x: x + 24, y: 318, w: 34, h: 34, geometry: "ellipse", fill: COLORS.softGreen, line: ctx.line(COLORS.green, 1) });
    ctx.addText(slide, { text: item[0], x: x + 24, y: 324, w: 34, h: 22, fontSize: 17, color: COLORS.greenDark, bold: true, typeface: "Arial", align: "center", valign: "middle" });
    ctx.addText(slide, { text: item[1], x: x + 72, y: 312, w: 198, h: 54, fontSize: 22, color: COLORS.ink, bold: true, typeface: "Arial", valign: "middle" });
    ctx.addText(slide, { text: item[2], x: x + 24, y: 400, w: 250, h: 110, fontSize: 20, color: COLORS.muted, typeface: "Arial" });
  });
}

function comparison(slide, ctx, data) {
  data.forEach((item, index) => {
    const x = 112 + index * 350;
    ctx.addShape(slide, { x, y: 300, w: 288, h: 178, fill: index === 2 ? COLORS.softGreen : COLORS.white, line: ctx.line(index === 2 ? COLORS.green : COLORS.line, 1) });
    ctx.addText(slide, { text: item[0], x: x + 22, y: 326, w: 232, h: 34, fontSize: 24, color: COLORS.greenDark, bold: true, typeface: "Arial" });
    ctx.addText(slide, { text: item[1], x: x + 22, y: 380, w: 232, h: 68, fontSize: 21, color: COLORS.ink, typeface: "Arial" });
  });
  ctx.addText(slide, {
    text: "Diferencial: a leitura RFID não fica restrita à identificação; ela alimenta auditoria patrimonial, registro e resolução de inconsistências e histórico operacional.",
    x: 126,
    y: 524,
    w: 880,
    h: 54,
    fontSize: 21,
    color: COLORS.muted,
    typeface: "Arial",
  });
}

async function imageSlide(slide, ctx, item) {
  if (item.techBadges) {
    const imageBox = { x: 66, y: 196, w: 706, h: 428 };
    ctx.addShape(slide, { ...imageBox, fill: COLORS.white, line: ctx.line(COLORS.line, 1) });
    await ctx.addImage(slide, { path: item.image, x: imageBox.x + 14, y: imageBox.y + 14, w: imageBox.w - 28, h: imageBox.h - 28, fit: "contain", alt: item.caption });

    ctx.addShape(slide, { x: 802, y: 196, w: 398, h: 428, fill: COLORS.white, line: ctx.line(COLORS.line, 1) });
    ctx.addText(slide, { text: "Tecnologias usadas", x: 828, y: 220, w: 340, h: 30, fontSize: 22, color: COLORS.greenDark, bold: true, typeface: "Arial" });
    ctx.addText(slide, { text: "Camadas do protótipo", x: 828, y: 256, w: 318, h: 22, fontSize: 15, color: COLORS.muted, typeface: "Arial" });
    item.techBadges.forEach((badge, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 828 + col * 182;
      const y = 306 + row * 102;
      const fill = index < 2 ? COLORS.softBlue : index < 4 ? COLORS.softGreen : COLORS.softGold;
      ctx.addShape(slide, { x, y, w: 156, h: 75, fill, line: ctx.line(COLORS.line, 1) });
      ctx.addText(slide, { text: badge[0], x: x + 10, y: y + 12, w: 136, h: 24, fontSize: 18, color: COLORS.greenDark, bold: true, typeface: "Arial", align: "center" });
      ctx.addText(slide, { text: badge[1], x: x + 10, y: y + 42, w: 136, h: 20, fontSize: 10, color: COLORS.muted, typeface: "Arial", align: "center" });
    });
    ctx.addText(slide, {
      text: "Middleware/API como núcleo de integração entre interface, banco e eventos RFID.",
      x: 828,
      y: 582,
      w: 340,
      h: 38,
      fontSize: 14,
      color: COLORS.muted,
      typeface: "Arial",
      align: "center",
    });
    ctx.addText(slide, { text: item.caption, x: 84, y: 638, w: 672, h: 28, fontSize: 16, color: COLORS.muted, typeface: "Arial", align: "center" });
    return;
  }
  const imageBox = { x: 86, y: 218, w: 1110, h: 382 };
  ctx.addShape(slide, { ...imageBox, fill: COLORS.white, line: ctx.line(COLORS.line, 1) });
  await ctx.addImage(slide, { path: item.image, x: imageBox.x + 14, y: imageBox.y + 14, w: imageBox.w - 28, h: imageBox.h - 28, fit: "contain", alt: item.caption });
  ctx.addText(slide, { text: item.caption, x: 94, y: 616, w: 1080, h: 32, fontSize: 18, color: COLORS.muted, typeface: "Arial", align: "center" });
}

function validation(slide, ctx, rows) {
  const x = 82;
  const y = 230;
  const widths = [330, 130, 650];
  ["Cenário", "Execuções", "Evidência"].forEach((header, index) => {
    const left = x + widths.slice(0, index).reduce((a, b) => a + b, 0);
    ctx.addShape(slide, { x: left, y, w: widths[index], h: 42, fill: COLORS.greenDark });
    ctx.addText(slide, { text: header, x: left + 14, y: y + 8, w: widths[index] - 28, h: 26, fontSize: 19, color: COLORS.white, bold: true, typeface: "Arial" });
  });
  rows.forEach((row, rowIndex) => {
    const top = y + 42 + rowIndex * 56;
    const fill = rowIndex % 2 === 0 ? COLORS.white : "#F0F5F2";
    [row[0], row[1], row[2]].forEach((cell, colIndex) => {
      const left = x + widths.slice(0, colIndex).reduce((a, b) => a + b, 0);
      ctx.addShape(slide, { x: left, y: top, w: widths[colIndex], h: 56, fill, line: ctx.line(COLORS.line, 1) });
      ctx.addText(slide, {
        text: cell,
        x: left + 14,
        y: top + 8,
        w: widths[colIndex] - 28,
        h: 38,
        fontSize: colIndex === 1 ? 22 : 18,
        color: colIndex === 1 ? COLORS.greenDark : COLORS.ink,
        bold: colIndex === 1,
        typeface: "Arial",
        align: colIndex === 1 ? "center" : "left",
      });
    });
  });
}

function flowLanes(slide, ctx, lanes) {
  lanes.forEach((lane, laneIndex) => {
    const x = laneIndex === 0 ? 86 : 662;
    const y = 252;
    const w = 520;
    ctx.addShape(slide, { x, y, w, h: 360, fill: COLORS.white, line: ctx.line(COLORS.line, 1) });
    ctx.addShape(slide, { x, y, w, h: 58, fill: laneIndex === 0 ? COLORS.softGreen : COLORS.softGold, line: ctx.line(COLORS.line, 1) });
    ctx.addText(slide, { text: lane.title, x: x + 24, y: y + 14, w: w - 48, h: 30, fontSize: 23, color: COLORS.greenDark, bold: true, typeface: "Arial" });
    lane.steps.forEach((step, index) => {
      const top = y + 84 + index * 48;
      ctx.addShape(slide, { x: x + 24, y: top, w: 34, h: 34, geometry: "ellipse", fill: laneIndex === 0 ? COLORS.softGreen : COLORS.softGold, line: ctx.line(lane.accent, 1) });
      ctx.addText(slide, { text: String(index + 1), x: x + 24, y: top + 4, w: 34, h: 24, fontSize: 20, color: COLORS.greenDark, bold: true, align: "center", typeface: "Arial" });
      ctx.addText(slide, { text: step, x: x + 74, y: top + 2, w: w - 116, h: 30, fontSize: 21, color: COLORS.ink, typeface: "Arial" });
    });
    ctx.addShape(slide, { x: x + 24, y: y + 286, w: w - 48, h: 1, fill: COLORS.line });
    ctx.addText(slide, { text: lane.note, x: x + 24, y: y + 298, w: w - 48, h: 44, fontSize: 18, color: COLORS.muted, typeface: "Arial" });
  });
}

function conclusionBlocks(slide, ctx, blocks) {
  const fills = [COLORS.softGreen, COLORS.softBlue];
  blocks.forEach((block, index) => {
    const x = index === 0 ? 88 : 660;
    const y = 216;
    const w = index === 0 ? 542 : 532;
    ctx.addShape(slide, { x, y, w, h: 331, fill: fills[index], line: ctx.line(COLORS.line, 1) });
    ctx.addText(slide, {
      text: block.title,
      x: x + 32,
      y: y + 28,
      w: w - 64,
      h: 42,
      fontSize: 28,
      color: COLORS.greenDark,
      bold: true,
      typeface: "Arial",
      align: "center",
    });
    ctx.addText(slide, {
      text: block.body.join("\n\n"),
      x: x + 32,
      y: y + 86,
      w: w - 64,
      h: 214,
      fontSize: index === 0 ? 18 : 19,
      color: COLORS.ink,
      typeface: "Arial",
      align: "center",
    });
  });
  ctx.addText(slide, {
    text: "O limite experimental permanece restrito ao cenário controlado; a ampliação física fica como continuidade do trabalho.",
    x: 134,
    y: 580,
    w: 1018,
    h: 42,
    fontSize: 19,
    color: COLORS.muted,
    typeface: "Arial",
    align: "center",
  });
}

async function cover(slide, ctx, item) {
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill: COLORS.white });
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill: COLORS.bg });
  ctx.addShape(slide, { x: 0, y: 0, w: 18, h: ctx.H, fill: COLORS.green });
  ctx.addShape(slide, { x: 46, y: 48, w: 36, h: 4, fill: COLORS.gold });
  ctx.addShape(slide, { x: 92, y: 136, w: 956, h: 1, fill: COLORS.line });
  ctx.addShape(slide, { x: 92, y: 622, w: 1094, h: 1, fill: COLORS.line });
  await ctx.addImage(slide, { path: ASSETS.brasao, x: 1056, y: 46, w: 72, h: 82, fit: "contain", alt: "Brasão da UESC" });

  ctx.addText(slide, { text: "Universidade Estadual de Santa Cruz - UESC", x: 92, y: 96, w: 720, h: 34, fontSize: 22, color: COLORS.ink, bold: true, typeface: "Arial" });
  ctx.addText(slide, {
    text: item.title,
    x: 86,
    y: 228,
    w: 1044,
    h: 126,
    fontSize: 32,
    color: COLORS.ink,
    bold: true,
    typeface: "Arial",
    align: "center",
  });
  if (item.subtitle) {
    ctx.addText(slide, { text: item.subtitle, x: 340, y: 376, w: 540, h: 28, fontSize: 19, color: COLORS.muted, typeface: "Arial", align: "center" });
  }
  ctx.addText(slide, { text: item.meta[0], x: 330, y: 414, w: 560, h: 38, fontSize: 30, color: COLORS.ink, bold: true, typeface: "Arial", align: "center" });
  ctx.addText(slide, { text: item.meta[1], x: 282, y: 484, w: 660, h: 34, fontSize: 28, color: COLORS.ink, bold: true, typeface: "Arial", align: "center" });
  ctx.addText(slide, { text: "Bacharelado em Ciência da Computação", x: 92, y: 646, w: 470, h: 30, fontSize: 22, color: COLORS.ink, bold: true, typeface: "Arial" });
  ctx.addText(slide, { text: "Ilhéus - Bahia, 2026", x: 908, y: 646, w: 250, h: 30, fontSize: 22, color: COLORS.ink, bold: true, typeface: "Arial", align: "right" });
}

function refs(slide, ctx, item, page) {
  base(slide, ctx, item.section, page);
  title(slide, ctx, item.title, 88);
  item.bullets.forEach((entry, index) => {
    const y = 222 + index * 54;
    ctx.addShape(slide, { x: 96, y: y + 8, w: 12, h: 12, fill: COLORS.green, geometry: "ellipse" });
    ctx.addText(slide, {
      text: entry,
      x: 122,
      y,
      w: 1000,
      h: 34,
      fontSize: 19,
      color: COLORS.ink,
      typeface: "Arial",
    });
  });
}

function demo(slide, ctx, item, page) {
  base(slide, ctx, item.section, page);
  title(slide, ctx, item.title, 54);
  description(slide, ctx, item.description);

  const videoBox = { x: 120, y: 180, w: 1040, h: 380 };
  ctx.addShape(slide, { ...videoBox, fill: COLORS.ink, line: ctx.line(COLORS.greenDark, 2) });
  ctx.addShape(slide, {
    x: videoBox.x + 22,
    y: videoBox.y + 22,
    w: videoBox.w - 44,
    h: videoBox.h - 44,
    fill: "#22303B",
    line: ctx.line("#314657", 1),
  });
  ctx.addShape(slide, { x: 574, y: 302, w: 132, h: 132, geometry: "ellipse", fill: COLORS.green, line: ctx.line(COLORS.green, 1) });
  ctx.addText(slide, {
    text: ">",
    x: 614,
    y: 320,
    w: 58,
    h: 74,
    fontSize: 60,
    color: COLORS.white,
    bold: true,
    typeface: "Arial",
    align: "center",
    valign: "middle",
  });
  ctx.addText(slide, {
    text: "Insira aqui o vídeo gravado do deploy",
    x: 250,
    y: 448,
    w: 780,
    h: 34,
    fontSize: 24,
    color: COLORS.white,
    bold: true,
    typeface: "Arial",
    align: "center",
  });
  ctx.addText(slide, {
    text: "Painel  •  Auditoria  •  Inconsistências",
    x: 250,
    y: 486,
    w: 780,
    h: 28,
    fontSize: 19,
    color: "#B8C7D3",
    typeface: "Arial",
    align: "center",
  });

  ctx.addShape(slide, { x: 456, y: 594, w: 368, h: 52, fill: COLORS.greenDark, line: ctx.line(COLORS.greenDark, 1) });
  ctx.addText(slide, {
    text: "Acessar deploy",
    x: 456,
    y: 607,
    w: 368,
    h: 28,
    fontSize: 22,
    color: COLORS.white,
    bold: true,
    typeface: "Arial",
    align: "center",
    hyperlink: item.url,
  });
  ctx.addText(slide, {
    text: item.url,
    x: 396,
    y: 654,
    w: 488,
    h: 24,
    fontSize: 16,
    color: COLORS.muted,
    typeface: "Arial",
    align: "center",
  });
}

async function thanks(slide, ctx, item, page) {
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill: COLORS.bg });
  ctx.addShape(slide, { x: 0, y: 0, w: 18, h: ctx.H, fill: COLORS.green });
  ctx.addShape(slide, { x: 92, y: 136, w: 1094, h: 1, fill: COLORS.line });
  ctx.addShape(slide, { x: 92, y: 584, w: 1094, h: 1, fill: COLORS.line });
  await ctx.addImage(slide, { path: ASSETS.brasao, x: 1056, y: 52, w: 72, h: 82, fit: "contain", alt: "Brasão da UESC" });
  ctx.addText(slide, {
    text: item.title,
    x: 120,
    y: 250,
    w: 1040,
    h: 96,
    fontSize: 68,
    color: COLORS.greenDark,
    bold: true,
    typeface: "Arial",
    align: "center",
  });
  ctx.addText(slide, {
    text: item.subtitle,
    x: 260,
    y: 356,
    w: 760,
    h: 44,
    fontSize: 30,
    color: COLORS.ink,
    typeface: "Arial",
    align: "center",
  });
  ctx.addText(slide, {
    text: item.author,
    x: 330,
    y: 482,
    w: 620,
    h: 34,
    fontSize: 24,
    color: COLORS.muted,
    typeface: "Arial",
    align: "center",
  });
  ctx.addText(slide, {
    text: String(page).padStart(2, "0"),
    x: 1190,
    y: 650,
    w: 44,
    h: 28,
    fontSize: 18,
    color: COLORS.muted,
    typeface: "Arial",
    align: "right",
  });
}

export async function buildSlide(presentation, ctx, index) {
  const item = slides[index];
  const slide = presentation.slides.add();
  const page = index + 1;
  if (item.kind === "cover") {
    await cover(slide, ctx, item);
    return slide;
  }
  if (item.kind === "refs") {
    refs(slide, ctx, item, page);
    return slide;
  }
  if (item.kind === "demo") {
    demo(slide, ctx, item, page);
    return slide;
  }
  if (item.kind === "thanks") {
    await thanks(slide, ctx, item, page);
    return slide;
  }
  base(slide, ctx, item.section, page);
  title(slide, ctx, item.title);
  description(slide, ctx, item.description);
  if (item.bullets) bulletList(slide, ctx, item.bullets);
  if (item.callouts) calloutRail(slide, ctx, item.callouts);
  if (item.proof) proofCards(slide, ctx, item.proof);
  if (item.steps) steps(slide, ctx, item.steps);
  if (item.comparison) comparison(slide, ctx, item.comparison);
  if (item.image) await imageSlide(slide, ctx, item);
  if (item.flowLanes) flowLanes(slide, ctx, item.flowLanes);
  if (item.validation) validation(slide, ctx, item.validation);
  if (item.conclusionBlocks) conclusionBlocks(slide, ctx, item.conclusionBlocks);
  return slide;
}

export const slideCount = slides.length;
