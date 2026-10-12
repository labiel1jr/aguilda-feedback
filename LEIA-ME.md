# A Guilda — página de feedback

Página estática (um `index.html`) com a arte do jogo, para quem testou contar o que achou.
As respostas vão para uma **planilha Google** (uma linha por pessoa). O WhatsApp e o "Copiar respostas" ficam como reserva.

- `index.html` — a página inteira (perguntas no começo do `<script>`, em `SECOES`).
- `assets/` — artes do jogo otimizadas (≈ 450 KB). Gerar de novo: `python tools/copiar_artes.py <pasta do repositório AGuilda>`.
- `apps-script/Codigo.gs` — o código que grava na planilha.

## 1. A planilha (uma vez)

1. Crie uma planilha nova no Google Planilhas, por exemplo **"A Guilda — feedback"**.
2. Menu **Extensões → Apps Script**. Apague o que estiver lá e cole o conteúdo de `apps-script/Codigo.gs`. Salve.
3. **Implantar → Nova implantação** → engrenagem → **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Autorize com sua conta (o Google avisa que o app não é verificado: **Avançado → Acessar**). O script só mexe nesta planilha.
5. Copie a **URL do app da Web** (termina em `/exec`). Abrir essa URL no navegador mostra "A Guilda — feedback: no ar."
6. No `index.html`, cole a URL em `const ENDPOINT = "";`.
7. Se quiser o botão do WhatsApp indo direto para você, ponha seu número em `const WHATSAPP = "";` (só dígitos, com 55 e DDD).

Se mudar o `Codigo.gs` depois: **Implantar → Gerenciar implantações → editar → Nova versão** (a URL continua a mesma).

## 2. Publicar (GitHub Pages)

O repositório do jogo é privado; esta página fica num repositório **público** separado, só com ela e as artes que usa.

1. No GitHub, crie o repositório público `aguilda-feedback` (vazio, sem README).
2. Envie esta pasta para ele (`git push`).
3. **Settings → Pages → Source: Deploy from a branch → main / (root)**.
4. A página fica em `https://<usuário>.github.io/aguilda-feedback/`.

O jogo abre a página pelo menu (**Dar feedback**) e no epílogo, já com `?v=<versão>&p=<Android|Windows>`; a página preenche "Onde você jogou?" sozinha e grava a versão na planilha.

## Colunas da planilha

`enviado_em`, `versao`, `plataforma_jogo`, `largura_tela` e uma coluna por pergunta (o `id` em `SECOES`). Perguntas novas criam colunas novas sozinhas; não renomeie um `id` existente, ou a resposta antiga e a nova ficam em colunas diferentes.
