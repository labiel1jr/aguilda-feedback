/**
 * A Guilda — recebe o formulário de feedback e grava uma linha por resposta na aba "Respostas".
 * Colar em Extensões → Apps Script da planilha e publicar como app da Web (ver LEIA-ME.md).
 * Colunas novas aparecem sozinhas quando a página ganha perguntas novas.
 */
const ABA = "Respostas";
const MAX_TEXTO = 2000;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const dados = JSON.parse((e && e.parameter && e.parameter.payload) || "{}");
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(ABA) || planilha.insertSheet(ABA);
    const cab = aba.getLastRow() > 0 ? aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0] : [];
    Object.keys(dados).forEach(function (k) { if (cab.indexOf(k) < 0) cab.push(k); });
    if (!cab.length) return ContentService.createTextOutput("vazio");
    aba.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight("bold");
    aba.setFrozenRows(1);
    aba.appendRow(cab.map(function (k) { return limpar(dados[k]); }));
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

/** Texto curto e sem fórmula: célula que começa com = + - @ viraria fórmula na planilha. */
function limpar(v) {
  if (v === undefined || v === null) return "";
  var s = String(v).slice(0, MAX_TEXTO);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Abrir no navegador a URL do app mostra isto: serve para conferir que a publicação deu certo. */
function doGet() {
  return ContentService.createTextOutput("A Guilda — feedback: no ar.");
}
