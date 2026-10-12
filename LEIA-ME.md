# A Guilda — página de feedback

Página estática (um `index.html`) com a arte do jogo, para quem testou contar o que achou.
As respostas vão para uma **planilha Google** (uma linha por pessoa). O WhatsApp e o "Copiar respostas" ficam como reserva.

- `index.html` — a página inteira (perguntas no começo do `<script>`, em `SECOES`).
- `assets/` — artes do jogo otimizadas (≈ 450 KB). Gerar de novo: `python tools/copiar_artes.py <pasta do repositório AGuilda>`.
- `apps-script/Codigo.gs` — o código que grava na planilha.

## 1. A planilha (uma vez)

O `apps-script/Codigo.gs` cria a planilha sozinho e depois recebe as respostas.

1. Abra **script.google.com → Novo projeto**. Dê o nome **A Guilda — feedback**.
2. Apague o que estiver lá e cole o conteúdo de `apps-script/Codigo.gs`.
3. Em `const PASTA_ID = "";`, cole o ID da pasta do Drive onde a planilha deve ficar (o trecho depois de `/folders/` no link da pasta). Vazio: fica na raiz do seu Drive. **Cuidado:** numa pasta compartilhada por link, a planilha herda o compartilhamento e quem tem o link da pasta vê as respostas (o script avisa no registro). Salve (ícone de disquete).
4. No alto, escolha a função **criarPlanilha** e clique em **Executar**. Autorize com sua conta (o Google avisa que o app não é verificado: **Avançado → Acessar**). O registro mostra o link da planilha criada, com as abas **Resumo** e **Respostas**.
5. **Implantar → Nova implantação** → engrenagem → **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a **URL do app da Web** (termina em `/exec`). Abrir essa URL no navegador mostra "A Guilda — feedback: no ar."
7. No `index.html`, cole a URL em `const ENDPOINT = "";`.
8. Opcional: escolha a função **testarResposta** e execute; aparece uma linha de teste na planilha e chega um e-mail. Apague a linha depois.

- **Resumo:** número de respostas, nota média, NPS (promotores − detratores), quantos acharam erro e jogariam a próxima, médias das escalas 1–5 com estrelas e as contagens de capítulo, plataforma, dificuldade, Ninho, herói favorito e esquecido, relações, tempo jogado e próxima versão. Atualiza sozinho.
- **Respostas:** uma linha por pessoa; a linha 1 tem os `id`s das perguntas (o título legível está na nota de cada célula). Nota 0–10 colorida.
- **E-mail automático:** cada resposta chega por e-mail na sua conta. Outro endereço: `EMAIL_AVISO`; `false` desliga. Cota do Google: 100 e-mails por dia numa conta comum.
- **WhatsApp:** o botão vai para o número em `const WHATSAPP` no `index.html`.
- **Botão "Mandar por e-mail"** (opcional): preencha `const EMAIL = "";` no `index.html`. Fica visível na página pública.

Se mudar o `Codigo.gs` depois: **Implantar → Gerenciar implantações → editar → Nova versão** (a URL continua a mesma). Não rode `criarPlanilha` de novo: ele só mostra a planilha que já existe.

## 2. Publicar (GitHub Pages)

O repositório do jogo é privado; esta página fica num repositório **público** separado, só com ela e as artes que usa.

1. No GitHub, crie o repositório público `aguilda-feedback` (vazio, sem README).
2. Envie esta pasta para ele (`git push`).
3. **Settings → Pages → Source: Deploy from a branch → main / (root)**.
4. A página fica em `https://<usuário>.github.io/aguilda-feedback/`.

O jogo abre a página pelo menu (**Dar feedback**) e no epílogo, já com `?v=<versão>&p=<Android|Windows>`; a página preenche "Onde você jogou?" sozinha e grava a versão na planilha.

## Colunas da planilha

`enviado_em`, `versao`, `plataforma_jogo`, `largura_tela` e uma coluna por pergunta (o `id` em `SECOES`). Perguntas novas criam colunas novas sozinhas; não renomeie um `id` existente, ou a resposta antiga e a nova ficam em colunas diferentes.
