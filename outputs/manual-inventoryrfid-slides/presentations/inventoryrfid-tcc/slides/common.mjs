import path from "node:path";

const ROOT = path.resolve(".");
const img = (relativePath) => path.join(ROOT, relativePath);

const COLORS = {
  bg: "#F7F9FB",
  ink: "#17202A",
  muted: "#51606F",
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
  brasao: img("docs/tcc/figs/brasao_uesc.png"),
  casosUso: img("docs/tcc/figs/casos_uso_rfid.png"),
  fluxo: img("docs/tcc/figs/fluxo_atividade_rfid.png"),
  arquitetura: img("outputs/manual-inventoryrfid-slides/presentations/inventoryrfid-tcc/assets/arquitetura_geral_rfid.png"),
  dashboard: img("docs/tcc/figs/sistema/sistema-dashboard.png"),
  itens: img("docs/tcc/figs/sistema/sistema-itens.png"),
  auditoria: img("docs/tcc/figs/sistema/sistema-auditoria.png"),
  inconsistencias: img("docs/tcc/figs/sistema/sistema-inconsistencias.png"),
  log: img("docs/tcc/figs/sistema/sistema-log.png"),
};

const slides = [
  {
    kind: "cover",
    section: "TCC",
    title: "Sistema de Inventário Baseado em Tecnologia RFID",
    subtitle: "Aplicado ao Colegiado de Ciência da Computação",
    meta: ["Ezequiel Lobo Oliveira", "Orientador: Prof. Jorge Lima", "UESC · 2026"],
  },
  {
    section: "ROTEIRO",
    title: "A defesa segue o fluxo recomendado para 15 minutos.",
    bullets: [
      "Introdução, motivação e objetivos em até 5 minutos.",
      "Metodologia, implementação, resultados e discussão como núcleo da apresentação.",
      "Conclusão com contribuição, limites e continuidade da proposta.",
    ],
    callouts: [
      { value: "15 min", label: "tempo total" },
      { value: "16", label: "slides de conteúdo" },
      { value: "ênfase", label: "resultados e discussão" },
    ],
  },
  {
    section: "INTRODUÇÃO",
    title: "O controle manual dificulta manter o inventário físico alinhado ao registro lógico.",
    bullets: [
      "Ambientes acadêmicos concentram equipamentos em laboratórios, salas e espaços compartilhados.",
      "A conferência visual depende de tempo, atenção e atualização manual.",
      "Divergências de localização comprometem rastreabilidade e tomada de decisão.",
    ],
    proof: [
      ["Inventário lógico", "registro esperado no sistema"],
      ["Inventário físico", "situação observada no ambiente"],
      ["Inconsistência", "diferença entre esperado e detectado"],
    ],
  },
  {
    section: "MOTIVAÇÃO",
    title: "RFID foi adotado como meio para transformar identificação física em evento computacional.",
    bullets: [
      "Etiquetas associam bens físicos a identificadores digitais.",
      "Leitores capturam tags e enviam eventos ao sistema.",
      "A aplicação interpreta leituras como evidência para auditoria patrimonial.",
    ],
    proof: [
      ["Menos dependência", "linha de visada e conferência item a item"],
      ["Mais rastreabilidade", "histórico, auditoria e inconsistências"],
      ["Cautela experimental", "sem extrapolar alcance ou leitura simultânea"],
    ],
  },
  {
    section: "OBJETIVOS",
    title: "O objetivo foi construir e validar funcionalmente um protótipo web de inventário com RFID.",
    bullets: [
      "Cadastrar ativos, locais, leitores RFID e eventos de leitura.",
      "Processar tags para atualizar localização física e apoiar auditorias.",
      "Validar o fluxo de leitura, API, persistência e registro de inconsistências.",
    ],
    callouts: [
      { value: "API REST", label: "entrada padronizada" },
      { value: "RFID", label: "identificação física" },
      { value: "Auditoria", label: "comparação lógico/físico" },
    ],
  },
  {
    section: "TRABALHOS RELACIONADOS",
    title: "A literatura reforça RFID, middleware e cautela na validação física.",
    comparison: [
      ["RFID em inventário", "base conceitual para automação"],
      ["Middleware/IoT", "eventos, normalização e integração"],
      ["Este protótipo", "auditoria patrimonial com comparação esperado-observado"],
    ],
  },
  {
    section: "METODOLOGIA",
    title: "A pesquisa foi aplicada e concentrou a avaliação no fluxo funcional do software.",
    steps: [
      ["1", "Revisão e requisitos", "Controle patrimonial, RFID, IoT, auditoria e trabalhos relacionados."],
      ["2", "Modelagem e implementação", "Entidades, API, regras de leitura, interface e persistência."],
      ["3", "Validação funcional", "Cenários controlados com leitor de proximidade, tag e comunicador."],
    ],
  },
  {
    section: "MATERIAIS",
    title: "O protótipo separa aplicação web, API e integração RFID.",
    bullets: [
      "Frontend: Next.js, React e TypeScript para operação e acompanhamento.",
      "Backend: Django REST Framework para regras, endpoints e autenticação.",
      "Hardware: leitor RFID USB/OTG de 13,56 MHz, uma tag física e comunicador intermediário.",
    ],
    callouts: [
      { value: "SQLite", label: "persistência local" },
      { value: "Token", label: "ingestão RFID" },
      { value: "USB/OTG", label: "leitor validado" },
    ],
  },
  {
    section: "ARQUITETURA",
    title: "A API atua como ponto comum entre interface, leitores e regras de inventário.",
    image: ASSETS.arquitetura,
    caption: "Arquitetura geral proposta para o InventoryRFID.",
  },
  {
    section: "MODELAGEM",
    title: "A solução foi modelada para conectar usuário, cadastros e integração RFID.",
    image: ASSETS.casosUso,
    caption: "Casos de uso principais do sistema.",
  },
  {
    section: "FLUXO RFID",
    title: "O fluxo distingue validação física real e caminho escalável por sensores/gateways.",
    flowLanes: [
      {
        title: "Rota validada fisicamente",
        accent: COLORS.green,
        steps: ["Leitor USB/OTG", "Comunicador intermediário", "Evento tags_read", "API processa auditoria"],
        note: "Comprovada com leitor de proximidade, uma tag e requisição HTTP ao backend.",
      },
      {
        title: "Rota escalável verificada por software",
        accent: COLORS.gold,
        steps: ["Sensor/gateway", "Evento motion_detected", "Janela start_reading", "tags_read enviado à API"],
        note: "Preserva o desenho para sensores e leitores em rede, sem afirmar validação física completa.",
      },
    ],
  },
  {
    section: "PROCESSAMENTO",
    title: "Cada leitura é validada, normalizada e convertida em consequência operacional.",
    steps: [
      ["1", "Receber evento", "tags_read enviado pelo comunicador ou por dispositivo com rede."],
      ["2", "Aplicar regras", "autenticação, janela ativa, deduplicação e validação da tag."],
      ["3", "Registrar efeito", "atualização de local, histórico, auditoria ou inconsistência."],
    ],
  },
  {
    section: "INTERFACE",
    title: "O painel inicial resume o estado operacional do inventário.",
    image: ASSETS.dashboard,
    caption: "Indicadores de leitores, itens, inconsistências e eventos recentes.",
  },
  {
    section: "AUDITORIA",
    title: "A auditoria compara itens esperados com tags detectadas durante a janela de leitura.",
    image: ASSETS.auditoria,
    caption: "Tela de auditoria patrimonial com RFID.",
  },
  {
    section: "INCONSISTÊNCIAS",
    title: "Divergências deixam de ser anotações soltas e passam a ter acompanhamento.",
    image: ASSETS.inconsistencias,
    caption: "Acompanhamento de pendências como item ausente, local divergente e tag desconhecida.",
  },
  {
    section: "VALIDAÇÃO",
    title: "Seis cenários confirmaram o comportamento funcional em dois ambientes.",
    validation: [
      ["Leitura conhecida", "6/6", "item detectado e ausentes classificados"],
      ["Resolução de inconsistência", "6/6", "pendência encerrada com histórico"],
      ["Tag desconhecida", "6/6", "inconsistência registrada"],
      ["Local divergente", "6/6", "divergência identificada"],
      ["Duplicidade", "6/6", "leituras consolidadas"],
      ["Leitor sem resposta", "6/6", "estado sinalizado"],
    ],
  },
  {
    section: "DISCUSSÃO E CONCLUSÃO",
    title: "O resultado principal é a validação da arquitetura de software para inventário com RFID.",
    bullets: [
      "O protótipo integra cadastro patrimonial, eventos RFID, auditoria, histórico e inconsistências.",
      "A contribuição está em transformar leitura RFID em evidência para comparar inventário lógico e físico.",
      "Os limites são claros: não foram medidos alcance, taxa de leitura, múltiplas tags ou interferência ambiental.",
    ],
    proof: [
      ["Contribuição", "base funcional extensível para rotinas patrimoniais"],
      ["Limite", "validação física restrita ao leitor de proximidade e uma tag"],
      ["Futuro", "antenas de maior alcance, sensores, múltiplas tags e relatórios"],
    ],
  },
  {
    kind: "refs",
    section: "REFERÊNCIAS",
    title: "Principais referências usadas na apresentação.",
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
];

function base(slide, ctx, section, page) {
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill: COLORS.bg });
  ctx.addShape(slide, { x: 0, y: 0, w: 18, h: ctx.H, fill: COLORS.green });
  ctx.addShape(slide, { x: 46, y: 48, w: 36, h: 4, fill: COLORS.gold });
  ctx.addText(slide, {
    text: section,
    x: 92,
    y: 34,
    w: 360,
    h: 34,
    fontSize: 18,
    color: COLORS.greenDark,
    bold: true,
    typeface: "Arial",
    valign: "middle",
    name: `kicker-${page}-label`,
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

function title(slide, ctx, text, y = 82, width = 1080) {
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

function bulletList(slide, ctx, bullets, x = 84, y = 230, w = 520, gap = 92) {
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
    const y = 236 + index * 112;
    ctx.addShape(slide, { x: 720, y, w: 408, h: 82, fill: index === 1 ? COLORS.softGold : COLORS.white, line: ctx.line(COLORS.line, 1) });
    ctx.addText(slide, { text: item.value, x: 746, y: y + 10, w: 170, h: 34, fontSize: 30, color: COLORS.greenDark, bold: true, typeface: "Arial" });
    ctx.addText(slide, { text: item.label, x: 746, y: y + 48, w: 340, h: 24, fontSize: 19, color: COLORS.muted, typeface: "Arial" });
  });
}

function proofCards(slide, ctx, proof) {
  proof.forEach((item, index) => {
    const y = 238 + index * 104;
    ctx.addShape(slide, { x: 718, y, w: 420, h: 76, fill: COLORS.white, line: ctx.line(COLORS.line, 1) });
    ctx.addText(slide, { text: item[0], x: 744, y: y + 11, w: 360, h: 28, fontSize: 23, color: COLORS.greenDark, bold: true, typeface: "Arial" });
    ctx.addText(slide, { text: item[1], x: 744, y: y + 43, w: 350, h: 24, fontSize: 18, color: COLORS.muted, typeface: "Arial" });
  });
}

function steps(slide, ctx, data) {
  data.forEach((item, index) => {
    const x = 92 + index * 374;
    ctx.addShape(slide, { x, y: 260, w: 312, h: 288, fill: COLORS.white, line: ctx.line(COLORS.line, 1) });
    ctx.addShape(slide, { x: x + 24, y: 286, w: 58, h: 58, geometry: "ellipse", fill: COLORS.softGreen, line: ctx.line(COLORS.green, 1) });
    ctx.addText(slide, { text: item[0], x: x + 24, y: 296, w: 58, h: 38, fontSize: 28, color: COLORS.greenDark, bold: true, typeface: "Arial", align: "center" });
    ctx.addText(slide, { text: item[1], x: x + 24, y: 368, w: 250, h: 42, fontSize: 25, color: COLORS.ink, bold: true, typeface: "Arial" });
    ctx.addText(slide, { text: item[2], x: x + 24, y: 424, w: 250, h: 84, fontSize: 20, color: COLORS.muted, typeface: "Arial" });
  });
}

function comparison(slide, ctx, data) {
  data.forEach((item, index) => {
    const x = 112 + index * 350;
    ctx.addShape(slide, { x, y: 286, w: 288, h: 178, fill: index === 2 ? COLORS.softGreen : COLORS.white, line: ctx.line(index === 2 ? COLORS.green : COLORS.line, 1) });
    ctx.addText(slide, { text: item[0], x: x + 22, y: 312, w: 232, h: 34, fontSize: 24, color: COLORS.greenDark, bold: true, typeface: "Arial" });
    ctx.addText(slide, { text: item[1], x: x + 22, y: 366, w: 232, h: 68, fontSize: 21, color: COLORS.ink, typeface: "Arial" });
  });
  ctx.addText(slide, {
    text: "Síntese: o trabalho adota RFID e middleware como base, mas mantém explícito que a validação física foi limitada ao hardware disponível.",
    x: 126,
    y: 510,
    w: 880,
    h: 54,
    fontSize: 21,
    color: COLORS.muted,
    typeface: "Arial",
  });
}

async function imageSlide(slide, ctx, item) {
  const imageBox = { x: 86, y: 204, w: 1110, h: 396 };
  ctx.addShape(slide, { ...imageBox, fill: COLORS.white, line: ctx.line(COLORS.line, 1) });
  await ctx.addImage(slide, { path: item.image, x: imageBox.x + 14, y: imageBox.y + 14, w: imageBox.w - 28, h: imageBox.h - 28, fit: "contain", alt: item.caption });
  ctx.addText(slide, { text: item.caption, x: 94, y: 616, w: 1080, h: 32, fontSize: 18, color: COLORS.muted, typeface: "Arial", align: "center" });
}

function validation(slide, ctx, rows) {
  const x = 82;
  const y = 214;
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
    const y = 238;
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

async function cover(slide, ctx, item) {
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill: COLORS.greenDark });
  ctx.addShape(slide, { x: 0, y: 0, w: ctx.W, h: ctx.H, fill: "#00000000" });
  ctx.addShape(slide, { x: 78, y: 76, w: 52, h: 6, fill: COLORS.gold });
  await ctx.addImage(slide, { path: ASSETS.brasao, x: 1038, y: 58, w: 98, h: 110, fit: "contain", alt: "Brasão da UESC" });
  ctx.addText(slide, { text: item.section, x: 78, y: 100, w: 300, h: 32, fontSize: 20, color: COLORS.softGold, bold: true, typeface: "Arial" });
  ctx.addText(slide, { text: item.title, x: 76, y: 188, w: 850, h: 168, fontSize: 50, color: COLORS.white, bold: true, typeface: "Arial" });
  ctx.addText(slide, { text: item.subtitle, x: 80, y: 378, w: 760, h: 44, fontSize: 26, color: "#DDEDE5", typeface: "Arial" });
  item.meta.forEach((line, index) => {
    ctx.addText(slide, { text: line, x: 82, y: 520 + index * 36, w: 720, h: 28, fontSize: 22, color: index === 0 ? COLORS.white : "#DDEDE5", typeface: "Arial", bold: index === 0 });
  });
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
  base(slide, ctx, item.section, page);
  title(slide, ctx, item.title);
  if (item.bullets) bulletList(slide, ctx, item.bullets);
  if (item.callouts) calloutRail(slide, ctx, item.callouts);
  if (item.proof) proofCards(slide, ctx, item.proof);
  if (item.steps) steps(slide, ctx, item.steps);
  if (item.comparison) comparison(slide, ctx, item.comparison);
  if (item.image) await imageSlide(slide, ctx, item);
  if (item.flowLanes) flowLanes(slide, ctx, item.flowLanes);
  if (item.validation) validation(slide, ctx, item.validation);
  return slide;
}

export const slideCount = slides.length;
