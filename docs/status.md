# Estado da entrega 0.1.0

Esta é uma primeira versão funcional e limitada. O briefing completo não está concluído.

## Fases

| Fase             | Implementado                                                                                                                              | Pendente                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Fundação         | React/TypeScript/Vite/Tailwind/Tauri 2/Rust, contratos IPC, lint, formatação, testes, lockfiles                                           | CI executado no GitHub; repositório remoto                                                                                               |
| Marca            | Símbolo original, wordmark horizontal/vertical, variantes SVG, ícones PNG/ICO                                                             | Avaliação visual com usuário; busca formal de marcas; PNGs dos wordmarks                                                                 |
| Design system    | Tokens, dois temas + sistema, controles nativos, foco, diálogo, notice/toast/estados, catálogo                                            | Auditoria visual e contraste automatizado completos; popover/tab customizados se houver uso                                              |
| Interface        | Todas as sete páginas, navegação recolhível, preferências persistidas                                                                     | Revisão visual real; internacionalização além do PT-BR                                                                                   |
| Nativo           | CPU/RAM/discos/processos reais, detalhes e encerramento confirmado de processos, scanner de unidade, limpeza confirmada e atalhos Windows | SFC/DISM internos, startup editável, DNS/Defender/updates dentro do app, demais categorias de limpeza, cancelamento/progresso da limpeza |
| Segurança/testes | Validação backend, allowlists, exclusão por handle, arquivos alterados/em uso e fixtures isoladas                                         | Matriz adversarial de junctions/reparse points, Windows 10 e 11, testes de elevação, auditoria independente                              |
| Distribuição     | Build de desenvolvimento Windows; configuração NSIS e workflow de build                                                                   | Build release/instalador bloqueados pelo Windows; assinatura; validação limpa; portabilidade; publicação                                 |

## Verificações executadas

- `npm run build`: TypeScript e bundle de produção aprovados. Fontes são locais.
- `npm run lint`: aprovado.
- `npm test`: **20 testes aprovados**, incluindo detalhes/confirmação/bloqueio/erro de processos, releitura vazia/erro sem dados antigos, consulta da Lixeira sem esvaziamento automático, proporções do sunburst, zoom e retorno com movimento reduzido, revisão/seleção/confirmação, preferências e navegação.
- `cargo check`: compilação Rust aprovada.
- `cargo test --lib`: **13 testes aprovados e 1 fixture ignorada intencionalmente**. Incluem identidade antiga rejeitada e encerramento somente de subprocesso de teste, bloqueio de processos essenciais, leitura de metadados de versão, 10.002 arquivos distribuídos até 35 níveis, limpeza em uma passagem e releitura sem candidatos; arquivos bloqueados, readonly, recentes e fora do escopo; filtro `.pf`; confirmação do Windows para Lixeira; totais de armazenamento. Exclusões só em fixtures. A fixture de processo ignorada é iniciada explicitamente pelo teste de encerramento, que passou.
- `cargo clippy -- -D warnings`: aprovado.
- `cargo build`: EXE de desenvolvimento gerado em `src-tauri/target/debug/sweeply.exe`.
- `npm run tauri -- build --debug --no-bundle`: **aprovado** na versão final, com frontend incluído no EXE de desenvolvimento. Um primeiro rebuild encontrou o processo de teste mantendo o EXE aberto; o processo identificado pelo caminho exato foi encerrado e o rebuild terminou corretamente.
- `cargo run`: processo iniciado; janela Sweeply identificada pelo inventário do Windows. Isso **não comprova** renderização correta nem funcionamento de IPC na janela.
- `npm run tauri build`: o frontend compilou; a compilação Rust release foi bloqueada ao tentar executar o build script de `crc32fast` pela política de Controle de Aplicativos do Windows, **os error 4551**. Nenhuma proteção foi alterada e nenhum instalador foi produzido.

## Revisão visual bloqueada

A captura da janela desktop solicitou autorização ao mecanismo de Computer Use e expirou. O Chrome DevTools estava com perfil ocupado, o navegador integrado não alcançou `127.0.0.1:1420`, e Chrome não estava disponível ao outro conector. Não foram afirmados testes visuais, screenshots, auditoria de contraste, acessibilidade real, responsividade real ou fluxo desktop ponta a ponta.

Para revisar localmente, execute `npm run tauri dev`. A prévia da interface também está em `npm run dev`. Só a aplicação desktop fornece dados e operações reais.

Nenhum arquivo real do usuário foi limpo, a Lixeira real não foi esvaziada, nenhum processo de terceiros foi encerrado, nenhuma configuração do Windows foi alterada e nenhuma reparação foi executada durante o desenvolvimento. Os testes de exclusão só tocaram arquivos criados pelos próprios testes.

Os diálogos compartilhados usam agora posição fixa, `inset: 0` e `margin: auto`, centralizando a confirmação independentemente do reset de CSS do Tailwind. A altura é limitada à janela, com rolagem interna. A atualização inclui a confirmação de encerramento e os detalhes de processos na página Desempenho; a validação visual na janela real continua pendente.

Os menus de seleção foram personalizados via CSS nativo (`base-select`/`::picker`) nos dois temas. O WebView2 instalado é 157, compatível com o recurso. O contorno azul das capturas correspondia ao foco de 2 px com offset exagerado; foi substituído por foco neutro de 1 px, apenas quando apropriado, e borda de foco no campo de busca. A troca é somente visual, compartilhada por todos os seletores; os 12 testes frontend e o build foram executados novamente. Revisão visual em execução continua pendente.

## Correções e ampliação de limpeza

A borda quadrada dos indicadores era causada pelo conflito entre a classe do componente `ring` e a utility homônima do Tailwind, que adicionava `box-shadow`. O componente usa agora `metric-ring`; a utility quadrada não é aplicada. A causa foi confirmada no CSS compilado e na imagem fornecida pelo usuário.

Os cortes da leitura de limpeza causavam resultados em lotes sucessivos; arquivos bloqueados também apareciam como candidatos. Dois testes foram executados e falharam antes da correção: só 10.000 dos 10.002 candidatos eram lidos, e um arquivo bloqueado era oferecido para limpeza. Ambos passaram depois. Leitura completa, preflight e mensagens de vazio/indisponibilidade agora são separados. A leitura completa foi estendida também ao armazenamento, conforme a atualização abaixo.

Categorias adicionadas: `%TEMP%`, Temp do Windows e Prefetch opcional, sempre preservando arquivos recentes e protegidos. Lixeira por API oficial, com confirmação nativa e sem execução em dados reais. A animação do sunburst foi adaptada ao vídeo local enviado pelo usuário; a validação visual em execução continua pendente.

## Limites de uso

Não usar como ferramenta final de manutenção antes da revisão visual e dos testes de segurança em Windows limpo. A limpeza remove permanentemente arquivos aprovados. A leitura ignora links e itens inacessíveis; a análise de armazenamento usa tamanho lógico, pode contar hardlinks repetidos e agrupa itens menores. Assistente IA e funções avançadas faltantes estão claramente identificados na interface.

## Armazenamento sem corte de duração

Removidos os cortes de 20 s, 150 mil entradas e 64 níveis. Um teste executado antes da correção reproduziu os totais zerados por tempo/quantidade; depois passou. A travessia iterativa conta arquivos até 70 níveis no teste, publica contagens/bytes reais e permite cancelamento. A tela consulta andamento, mantém carregamento além de 20 s e identifica resultados cancelados como parciais; desmontar o componente cancela apenas a análise correspondente; trocar de aba agora mantém o componente e a leitura. O gráfico continua agrupando os menores itens e limitando os níveis detalhados, sem excluir seus bytes do total.

Os 14 testes frontend e 13 testes Rust da biblioteca passaram. Um ensaio de cargo test também tentou iniciar o harness do binário principal, que não tem testes, e o Windows bloqueou esse arquivo com os error 4551. A suíte de lógica foi executada explicitamente com cargo test --lib; nenhuma proteção foi alterada. A fixture ignorada de processo continua sendo executada somente como subprocesso do teste correspondente. Lint, TypeScript e Clippy aprovados. Não foi medida a duração de uma leitura completa de disco real nem feita revisão visual da nova tela.

## Preservação ao trocar de aba/unidade

A chave variável do main e a montagem condicional apagavam o estado local de Armazenamento e cancelavam a leitura. Dois testes de regressão no App completo falharam antes da correção: a pasta aberta desaparecia ao voltar de Desempenho e o scan pendente era cancelado ao sair. A tela agora é mantida montada e ocultada com hidden quando inativa, preservando resultado, trilha e trabalho em andamento. Um terceiro teste confirma cache por unidade, ausência de novo scan ao restaurar e descarte opcional do cache. Os 17 testes frontend, TypeScript e lint passaram; o Rust não foi alterado nesta correção. Persistência entre reinicializações não foi implementada, e revisão visual continua pendente.

## Preservação de Limpeza e foco do sunburst

A montagem condicional também apagava a análise, seleção e relatório de Limpeza. Três testes de regressão na navegação real do App falharam antes da correção e passaram depois: seleção preservada, análise pendente concluída em outra aba e relatório final preservado sem repetir exclusão. Limpeza permanece montada e é ocultada ao navegar, como Armazenamento. O plano continua em memória, válido por 15 minutos, com confirmação e revalidação no backend; essa regra agora aparece na revisão. Os 20 testes frontend, TypeScript e lint passaram.

O foco retangular do SVG do sunburst foi desativado no contêiner e nos elementos interativos. O foco de teclado usa o stroke da própria fatia/círculo, preservando a indicação sem caixa ao redor. O usuário informou que a borda preta desaparece ao capturar a tela; não foi possível validar visualmente esse estado transitório nesta sessão.

## Identificação mais discreta

Removidos símbolo e wordmark do topo da sidebar, reduzindo o espaço antes de Seu computador. O cabeçalho interno mostra apenas a página atual. O título da janela e da prévia web é Sweeply — Limpa seu PC; os ícones da janela e da barra de tarefas foram preservados. Os 20 testes frontend e lint passaram. Revisão visual continua pendente.

## Preparação do GitHub e atualizador — 11/11/2026

Repositório oficial criado em GabriellHammes16/Sweeply. Implementados consulta automática configurável, consulta manual, aviso de nova versão, confirmação de instalação e progresso de download. Configurados assinatura com versão vinculada, allowlist de anexos oficiais e secret de assinatura no GitHub. Workflow por tags cria release NSIS em rascunho com manifesto do atualizador.

Validação: 24 testes frontend e 14 testes Rust aprovados (mais uma fixture ignorada intencionalmente), TypeScript, lint e Clippy aprovados. O cache local de tauri-macros precisou ser reconstruído para resolver E0463; depois o EXE debug foi compilado e aberto. Na janela real foram conferidos os indicadores sem moldura quadrada, a sidebar simplificada e a verificação automática que informa corretamente que ainda não há release publicada. Capturadas telas reais de Limpeza, Ferramentas e Atualizações em docs/images, sem expor caminhos de arquivos pessoais.

Não houve exclusão de dados reais, instalação de uma atualização ou publicação de release. Validação ponta a ponta do instalador e do fluxo entre duas versões continua pendente; requer release assinada e ambiente Windows de teste. A duração de análise completa de disco não foi medida. O EXE debug é para revisão local, não substitui a validação do instalador de produção.
