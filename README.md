# YUYU.EXE

Primeira versão funcional de um presente digital de aniversário em formato de pequeno sistema operacional fictício.

## Como abrir localmente

Abra `index.html` diretamente no navegador. O projeto usa apenas HTML, CSS e JavaScript puros, então não precisa de instalação, servidor, backend ou banco de dados.

## Arquivos principais

- `index.html`: estrutura da tela inicial, desktop, janelas e templates.
- `css/style.css`: identidade visual, responsividade e animações.
- `js/script.js`: estado da experiência, senha, galeria, janelas e desbloqueios.
- `assets/images/`: imagens provisórias em SVG.

## Onde personalizar

Edite `js/script.js`, no objeto `CONFIG`, para trocar os conteúdos provisórios.

### Senha e dica

```js
password: "yuyu",
secretHint: "Hint: something we have in common...",
```

Troque `"yuyu"` pela senha real e altere a dica no mesmo bloco.

Importante: esta senha não é proteção real. Como o projeto é estático, qualquer pessoa pode ver a senha no JavaScript ou acessar imagens publicadas diretamente pelo endereço do arquivo.

### Foto secreta

Substitua o arquivo `assets/images/secret-memory-placeholder.svg` por uma foto real, ou altere o caminho:

```js
secretImage: {
  src: "assets/images/sua-foto-real.jpg",
  alt: "Descrição acessível da foto.",
  caption: "Legenda opcional.",
},
```

### Galeria field_trip

Adicione imagens em `assets/images/` e edite a lista `gallery` em `js/script.js`.

### Textos de little_things

Troque os placeholders na lista `notes` em `js/script.js`.

### Surpresa final

Altere `finalImage` em `js/script.js` para trocar a foto final. A mensagem provisória da janela final está na função `renderOpenLast`.

## Como testar as interações

1. Abra `index.html`.
2. Clique em `LET'S EXPLORE`.
3. Abra `little_things`, `field_trip` e `secret_folder`.
4. Confirme se o progresso muda até liberar `open_me_last`.
5. Em `secret_folder`, teste uma senha errada.
6. Teste a senha provisória `yuyu`.
7. Abra e feche a foto ampliada.
8. Abra `open_me_last` após o desbloqueio.
9. Teste no celular ou com a janela estreita do navegador.
10. Use Tab e Enter para navegar por teclado.

## Publicar no GitHub Pages

Envie estes arquivos para um repositório no GitHub. Nas configurações do repositório, ative GitHub Pages usando a branch principal e a pasta raiz. Como todos os caminhos são relativos, o site deve funcionar em hospedagem estática.

## Conteúdo ainda pendente

- Fotos reais para `field_trip`.
- Foto real de `secret_folder`.
- Foto final de `open_me_last`.
- Senha definitiva e dica personalizada.
- Textos reais dos arquivos em `little_things`.
- Mensagem final de aniversário.
