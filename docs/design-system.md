# Marca e design system

## Sweeply — Seu PC, mais leve.

Organização sem ruído. Grafite, cores funcionais e linguagem direta dão destaque a arquivos, métricas e decisões. O Sweeply oferece controle sem prometer aceleração artificial.

O símbolo original usa duas curvas deslocadas: uma forma de S com movimento contínuo, sugerindo organização e circulação. Sem vassoura, foguete ou escudo. A sobreposição usa opacidade da mesma tinta, preservando a leitura monocromática. Manter uma margem livre mínima equivalente a 1/4 do símbolo. Não esticar, girar, adicionar efeitos ou recolorir por categoria.

Arquivos vetoriais em `branding/logos`: horizontal, vertical e símbolo; variantes `dark`, `light`, `mono-dark`, `mono-light`. A versão dark é para fundo escuro; light para fundo claro. O ícone do app está em `branding/icons/app.svg`; PNGs e ICO em `src-tauri/icons`. Regenere com `node scripts/branding.mjs` e `npm run tauri -- icon branding/icons/app.svg --output src-tauri/icons`.

## Tokens

| Papel         | Escuro  | Claro                          |
| ------------- | ------- | ------------------------------ |
| Fundo         | #202226 | #E8EDF0                        |
| Sidebar       | #191B1E | #E0E6EA, translucidez moderada |
| Superfície    | #292C31 | branco, translucidez moderada  |
| Elevada       | #30343A | #F3F5F7                        |
| Texto         | #F5F5F5 | #242B32                        |
| Secundário    | #A9ADB4 | #566775                        |
| CPU           | #E9AB70 | #9E571E                        |
| RAM           | #75A9DF | #356EAC                        |
| Armazenamento | #70BCA3 | #27775E                        |

Os tons claros das cores funcionais são escurecidos no tema claro para preservar legibilidade. Não usar cor como único indicador: sempre acompanhar com texto e valores. Vidro se limita à sidebar e superfícies, com fallback opaco em `prefers-reduced-transparency`. Sem gradientes decorativos no produto; a miniatura Sistema representa a alternância entre temas.

## Tipografia e espaçamento

Inter 400/500/600, incluída localmente via Fontsource, sem requisições de fontes externas. Display 32–36 px; título de página 28 px; seções 18 px; corpo 14 px; labels e metadados com no mínimo 12 px. Métricas em 24–32 px e números tabulares. Raios: controles 8 px, painéis 12 px, diálogos 16 px. Espaçamento principal baseado em 4 px, com ajustes ópticos nos ícones.

## Componentes implementados

Botões primário/secundário/perigoso, icon buttons com nome acessível, painéis, inputs, checkbox, switch, select nativo, disclosure (`details`), diálogos modais nativos, notices, tags, toast, estado vazio/erro/carregamento, skeleton e progress no catálogo, sidebar recolhível, busca, seleção de tema, indicador circular, tabela e gráficos SVG.

O catálogo usa os mesmos componentes do aplicativo: botão Shapes no cabeçalho ou `#design-system`. O catálogo identifica seus números como exemplos. Tooltips simples usam `title`, acompanhados por `aria-label`; popovers e tabs customizados não foram adicionados sem uma necessidade funcional.

Os seletores de CPU/memória, unidade, idioma e catálogo usam o próprio `<select>` com `appearance: base-select` e `::picker(select)`: menu com superfície do tema, borda discreta, cantos de 8 px e opções com seleção/hover legíveis. A personalização mantém o comportamento nativo de teclado, Escape e foco, sem dependência nova ou animação de abertura. O WebView2 local verificado é versão 157. Referência: [select personalizável no Chromium](https://developer.chrome.com/blog/a-customizable-select). Navegadores sem suporte conservam o select nativo com cores de opção ajustadas.

O foco de teclado usa contorno estático de 1 px em tom neutro, próximo do controle. Cliques de mouse não adicionam halo aos botões; a busca sinaliza foco pela borda do campo inteiro, sem contorno arredondado interno. O indicador de carregamento só aparece em operações realmente pendentes e não nos botões de seleção.

Lucide, espessura consistente e tamanhos 16–24 px; sem logos de terceiros desenhados. Indicadores circulares contínuos representam um único percentual. O sunburst representa a hierarquia real por proporção de bytes: o limite por pasta é 128 filhos detalhados e um grupo Outros. Anéis separados e hover/foco com dados. Até três anéis por visualização.

## Acessibilidade e movimento

Foco visível, skip link, controles nativos, nomes nos botões de ícones, modal com Escape/foco contido, tabela semântica, labels nos campos e paths do sunburst operáveis com Enter/Espaço. O modo claro ajusta as cores de texto e métricas. Animações de 150–200 ms; a preferência de movimento reduzido do sistema prevalece. O usuário pode desativá-las nas configurações.

Telas adaptáveis, com navegação compacta abaixo de 900 px. A janela desktop tem mínimo de 760×600; a prévia web também se reorganiza em telas menores. Consulte os limites de uso em [Operação e segurança](operation.md).
