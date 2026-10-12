/**
 * A Guilda — planilha de feedback.
 *
 * Projeto avulso do Apps Script (script.google.com → Novo projeto). Duas partes:
 *  1. criarPlanilha(): rode UMA vez. Cria a planilha "A Guilda — feedback" na pasta do Drive (PASTA_ID),
 *     com a aba Respostas (cabeçalho, larguras, cores) e a aba Resumo (nota média, NPS, médias e contagens).
 *  2. doPost(): recebe o formulário da página (app da Web) e grava uma linha por resposta; também avisa por e-mail.
 * Passo a passo no LEIA-ME.md.
 */

// ID da pasta do Drive onde a planilha é criada: o trecho depois de /folders/ no link da pasta.
// Vazio: cria na raiz do seu Drive. Não versione o ID se a pasta for compartilhada por link.
const PASTA_ID = "";
const NOME_PLANILHA = "A Guilda — feedback";
const ABA = "Respostas";
const ABA_RESUMO = "Resumo";
const MAX_TEXTO = 2000;
// Cada resposta também chega por e-mail. Vazio: vai para a sua conta (quem publicou o script).
// Outro endereço (ou vários, separados por vírgula): escreva aqui. false: não manda e-mail.
const EMAIL_AVISO = "";

// Colunas na ordem da página (index.html → SECOES). Perguntas novas criam colunas sozinhas no fim.
const COLUNAS = [
  ["enviado_em", "Enviado em", 150], ["versao", "Versão", 70], ["plataforma_jogo", "Plataforma (jogo)", 110], ["largura_tela", "Tela (px)", 70],
  ["nome", "Nome", 130], ["plataforma", "Onde jogou", 140], ["tempo", "Tempo jogado", 120], ["capitulo", "Chegou até", 120], ["perfil", "Joga estratégia/RPG", 120],
  ["clareza_chance", "Clareza: chance", 90], ["clareza_mapa", "Clareza: mapa", 90], ["clareza_relacoes", "Clareza: relações", 90], ["clareza_extras", "Clareza: contratos/grimório", 110],
  ["confuso", "O que ficou confuso", 280],
  ["dificuldade", "Dificuldade", 140], ["travou_onde", "Onde empacou", 220], ["ninho", "Ninho do Corvo", 120],
  ["favorito", "Favorito", 90], ["esquecido", "Quase não usou", 110], ["por_que_esquecido", "Por quê", 220], ["relacoes_mudaram", "Relações mudaram escolhas", 110],
  ["historia", "História", 70], ["arte", "Arte", 60], ["musica", "Música", 90], ["arte_comentario", "Arte estranha", 220],
  ["bug", "Achou erro", 80], ["bug_desc", "Descrição do erro", 320],
  ["nps", "Nota 0–10", 70], ["mudaria", "Mudaria", 300], ["gostou", "Mais gostou", 300], ["proxima", "Jogaria a próxima", 100],
];
// Respostas que são número (vão para a planilha como número, para as médias funcionarem).
const NUMERICAS = ["clareza_chance", "clareza_mapa", "clareza_relacoes", "clareza_extras", "historia", "arte", "musica", "nps", "largura_tela"];

const COR = { tinta: "#2a1f14", pergaminho: "#f3ead3", ouro: "#d4a94a", madeira: "#3d2f22", texto: "#f1e6cc" };


// ================= 1. Criar a planilha (rodar uma vez) =================

function criarPlanilha() {
  const props = PropertiesService.getScriptProperties();
  const existente = props.getProperty("PLANILHA_ID");
  if (existente) {
    try {
      Logger.log("A planilha já existe: " + SpreadsheetApp.openById(existente).getUrl());
      return;
    } catch (e) { /* apagada: cria outra */ }
  }
  const ss = SpreadsheetApp.create(NOME_PLANILHA);
  if (PASTA_ID) {
    const pasta = DriveApp.getFolderById(PASTA_ID);
    DriveApp.getFileById(ss.getId()).moveTo(pasta);
    if (pasta.getSharingAccess() !== DriveApp.Access.PRIVATE) {
      Logger.log("ATENÇÃO: a pasta \"" + pasta.getName() + "\" é compartilhada (" + pasta.getSharingAccess() +
        "). A planilha herda o compartilhamento: quem abre a pasta pode ver as respostas.");
    }
  }
  props.setProperty("PLANILHA_ID", ss.getId());

  const aba = ss.getSheets()[0].setName(ABA);
  montarRespostas(aba);
  montarResumo(ss.insertSheet(ABA_RESUMO), aba);
  ss.setActiveSheet(ss.getSheetByName(ABA_RESUMO));
  ss.moveActiveSheet(1);
  Logger.log("Planilha criada: " + ss.getUrl());
}

function montarRespostas(aba) {
  aba.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS.map(function (c) { return c[0]; })]);
  // Os ids ficam na linha 1 (o script procura por eles); o título legível vai como nota.
  COLUNAS.forEach(function (c, i) {
    aba.getRange(1, i + 1).setNote(c[1]);
    aba.setColumnWidth(i + 1, c[2]);
  });
  aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight("bold").setBackground(COR.madeira).setFontColor(COR.ouro).setWrap(true).setVerticalAlignment("middle");
  aba.setRowHeight(1, 36);
  aba.setFrozenRows(1);
  aba.setFrozenColumns(5);
  aba.getRange("A2:A").setNumberFormat("dd/mm/yyyy hh:mm");
  aba.getRange(2, 1, aba.getMaxRows() - 1, COLUNAS.length).setWrap(true).setVerticalAlignment("top");
  aba.getRange(1, 1, aba.getMaxRows(), COLUNAS.length).applyRowBanding(SpreadsheetApp.BandingTheme.BROWN, true, false);
  // Nota 0–10 colorida: vermelho até 6, amarelo 7–8, verde 9–10
  const nps = aba.getRange(2, coluna("nps"), aba.getMaxRows() - 1, 1);
  aba.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThanOrEqualTo(9).setBackground("#b7dfa5").setRanges([nps]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(7, 8).setBackground("#f3dd9b").setRanges([nps]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberLessThanOrEqualTo(6).setBackground("#f0b3a0").setRanges([nps]).build(),
  ]);
}

function montarResumo(r, aba) {
  const col = function (id) { return ABA + "!" + letra(coluna(id)) + "2:" + letra(coluna(id)); };
  r.setHiddenGridlines(true);
  r.getRange("A1").setValue("A Guilda — resumo do feedback").setFontSize(18).setFontWeight("bold").setFontColor(COR.madeira);
  r.getRange("A2").setValue("Atualiza sozinho a cada resposta. Detalhes na aba Respostas.").setFontStyle("italic").setFontColor("#7a6548");

  // Números principais
  const nps = col("nps");
  const kpis = [
    ["Respostas", "=COUNTA(" + col("enviado_em") + ")"],
    ["Nota média (0–10)", "=IFERROR(ROUND(AVERAGE(" + nps + "),1),\"–\")"],
    ["NPS (−100 a 100)", "=IFERROR(ROUND((COUNTIF(" + nps + ",\">=9\")-COUNTIF(" + nps + ",\"<=6\"))/COUNT(" + nps + ")*100),\"–\")"],
    ["Acharam erro", "=COUNTIF(" + col("bug") + ",\"Sim\")"],
    ["Jogariam a próxima", "=COUNTIF(" + col("proxima") + ",\"Sim\")"],
  ];
  kpis.forEach(function (k, i) {
    r.getRange(4, 1 + i * 3).setValue(k[0]).setFontColor("#7a6548").setFontWeight("bold");
    r.getRange(5, 1 + i * 3).setFormula(k[1]).setFontSize(22).setFontWeight("bold").setFontColor(COR.madeira).setHorizontalAlignment("left");
  });

  // Médias das escalas 1–5
  r.getRange("A7").setValue("Médias (1 a 5)").setFontWeight("bold").setFontSize(13).setFontColor(COR.madeira);
  const escalas = [["clareza_chance", "Clareza: chance de sucesso"], ["clareza_mapa", "Clareza: Mapa Mágico"], ["clareza_relacoes", "Clareza: relações"],
    ["clareza_extras", "Clareza: contratos e Grimório"], ["historia", "História"], ["arte", "Arte"], ["musica", "Música"]];
  escalas.forEach(function (e, i) {
    r.getRange(8 + i, 1).setValue(e[1]);
    r.getRange(8 + i, 2).setFormula("=IFERROR(ROUND(AVERAGE(" + col(e[0]) + "),1),\"–\")").setFontWeight("bold");
    r.getRange(8 + i, 4).setFormula("=IFERROR(REPT(\"★\",ROUND(AVERAGE(" + col(e[0]) + ")))&REPT(\"☆\",5-ROUND(AVERAGE(" + col(e[0]) + "))),\"\")").setFontColor(COR.ouro);
  });

  // Grade do resumo: colunas de rótulo (A, D, G, J, M), de número (B, E, H, K, N) e espaços estreitos entre elas
  // Contagens das escolhas, lado a lado a partir da linha 17
  const blocos = [["capitulo", "Chegou até"], ["plataforma", "Onde jogou"], ["dificuldade", "Dificuldade"], ["ninho", "Ninho do Corvo"],
    ["favorito", "Herói favorito"], ["esquecido", "Quase não usou"], ["relacoes_mudaram", "Relações mudaram escolhas"], ["tempo", "Tempo jogado"], ["proxima", "Jogaria a próxima"]];
  blocos.forEach(function (b, i) {
    const c0 = 1 + (i % 5) * 3, l0 = 17 + Math.floor(i / 5) * 12;
    const L = letra(coluna(b[0]));
    r.getRange(l0, c0).setValue(b[1]).setFontWeight("bold").setFontSize(12).setFontColor(COR.madeira);
    r.getRange(l0 + 1, c0).setFormula("=IFERROR(QUERY(" + ABA + "!" + L + "2:" + L + ",\"select " + L + ", count(" + L + ") where " + L +
      " is not null group by " + L + " order by count(" + L + ") desc label count(" + L + ") ''\",0),\"–\")");
  });
  for (var c = 1; c <= 15; c++) r.setColumnWidth(c, c % 3 === 0 ? 24 : (c % 3 === 1 ? 170 : 60));
  r.setColumnWidth(1, 220);
}


// ================= 2. Receber as respostas (app da Web) =================

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const dados = JSON.parse((e && e.parameter && e.parameter.payload) || "{}");
    const ss = planilha();
    const aba = ss.getSheetByName(ABA) || ss.insertSheet(ABA);
    const cab = aba.getLastRow() > 0 ? aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0] : [];
    const n = cab.length;
    Object.keys(dados).forEach(function (k) { if (cab.indexOf(k) < 0) cab.push(k); });
    if (!cab.length) return ContentService.createTextOutput("vazio");
    if (cab.length > n) aba.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight("bold");
    aba.appendRow(cab.map(function (k) { return valor(k, dados[k]); }));
    avisarPorEmail(dados, ss);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

/** Abrir no navegador a URL do app mostra isto: serve para conferir que a publicação deu certo. */
function doGet() {
  return ContentService.createTextOutput("A Guilda — feedback: no ar.");
}

function planilha() {
  const id = PropertiesService.getScriptProperties().getProperty("PLANILHA_ID");
  if (id) return SpreadsheetApp.openById(id);
  return SpreadsheetApp.getActiveSpreadsheet();   // script colado dentro de uma planilha (Extensões → Apps Script)
}

/** Número vira número; data vira data; texto fica curto e sem fórmula (= + - @ no começo viraria fórmula). */
function valor(k, v) {
  if (v === undefined || v === null || v === "") return "";
  var s = String(v).slice(0, MAX_TEXTO);
  if (NUMERICAS.indexOf(k) >= 0 && /^\d+$/.test(s)) return Number(s);
  if (k === "enviado_em" && !isNaN(Date.parse(s))) return new Date(s);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Manda a resposta por e-mail. Falha no e-mail (cota diária, por exemplo) não perde a linha da planilha. */
function avisarPorEmail(dados, ss) {
  if (EMAIL_AVISO === false) return;
  try {
    var para = EMAIL_AVISO || Session.getEffectiveUser().getEmail();
    var quem = dados.nome ? String(dados.nome).slice(0, 60) : "alguém";
    var assunto = "A Guilda — feedback de " + quem + (dados.nps !== undefined && dados.nps !== "" ? " (nota " + dados.nps + ")" : "");
    var titulos = {};
    COLUNAS.forEach(function (c) { titulos[c[0]] = c[1]; });
    var linhas = Object.keys(dados).filter(function (k) { return dados[k] !== "" && dados[k] !== undefined; })
      .map(function (k) { return (titulos[k] || k) + ": " + String(dados[k]).slice(0, MAX_TEXTO); });
    linhas.push("", "Planilha: " + ss.getUrl());
    MailApp.sendEmail(para, assunto, linhas.join("\n"));
  } catch (err) {
    console.error("e-mail não enviado: " + err);
  }
}


// ================= Utilidades =================

function coluna(id) {
  for (var i = 0; i < COLUNAS.length; i++) if (COLUNAS[i][0] === id) return i + 1;
  throw new Error("coluna desconhecida: " + id);
}

function letra(n) {
  var s = "";
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** Teste sem a página: grava uma resposta de exemplo (e manda o e-mail). Apague a linha depois. */
function testarResposta() {
  doPost({ parameter: { payload: JSON.stringify({
    enviado_em: new Date().toISOString(), versao: "0.9", plataforma_jogo: "Teste", nome: "Teste do script",
    plataforma: "PC (Windows)", capitulo: "Capítulo 2", clareza_chance: "4", favorito: "Mira", nps: "9", proxima: "Sim",
  }) } });
  Logger.log("Resposta de teste gravada em " + planilha().getUrl());
}
