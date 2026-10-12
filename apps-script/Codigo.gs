/**
 * A Guilda — recebe o formulário de feedback e grava uma linha por resposta na aba "Respostas".
 * Colar em Extensões → Apps Script da planilha e publicar como app da Web (ver LEIA-ME.md).
 * Colunas novas aparecem sozinhas quando a página ganha perguntas novas.
 */
const ABA = "Respostas";
const MAX_TEXTO = 2000;
// Cada resposta também chega por e-mail. Vazio: vai para a conta Google dona da planilha (quem publicou o script).
// Para mandar a outro endereço (ou a vários, separados por vírgula), escreva aqui. false: não manda e-mail.
const EMAIL_AVISO = "";

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
    avisarPorEmail(dados, planilha);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

/** Manda a resposta por e-mail. Falha no e-mail (cota diária, por exemplo) não perde a linha da planilha. */
function avisarPorEmail(dados, planilha) {
  if (EMAIL_AVISO === false) return;
  try {
    var para = EMAIL_AVISO || Session.getEffectiveUser().getEmail();
    var quem = dados.nome ? String(dados.nome).slice(0, 60) : "alguém";
    var assunto = "A Guilda — feedback de " + quem + (dados.nps !== undefined && dados.nps !== "" ? " (nota " + dados.nps + ")" : "");
    var linhas = Object.keys(dados).filter(function (k) { return dados[k] !== "" && dados[k] !== undefined; })
      .map(function (k) { return k + ": " + String(dados[k]).slice(0, MAX_TEXTO); });
    linhas.push("", "Planilha: " + planilha.getUrl());
    MailApp.sendEmail(para, assunto, linhas.join("\n"));
  } catch (err) {
    console.error("e-mail não enviado: " + err);
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
