# Sweeply

**Seu PC, mais leve.** Aplicativo gratuito e local para entender e cuidar de computadores Windows 10 e 11. Licença MIT.

Versão **1.0.0**. A primeira release reúne análise de armazenamento, limpeza revisada, monitoramento e atalhos oficiais. Os limites de segurança e de validação descritos abaixo continuam aplicáveis. Veja a apresentação com imagens no [README](../README.md).

## Executar

Pré-requisitos: Windows 10/11 x64, Node.js 22.12 ou superior, npm, Rust estável com target MSVC, Visual Studio C++ Build Tools e Windows SDK. O aplicativo usa o **Microsoft Edge WebView2 Runtime**. Veja os [pré-requisitos oficiais do Tauri](https://v2.tauri.app/start/prerequisites/).

```powershell
npm ci
npm run tauri dev
```

Para conferir somente a interface: `npm run dev`, em `http://127.0.0.1:1420`. A versão web indica a ausência do backend e não inventa métricas nem simula limpeza.

O EXE de desenvolvimento desta entrega foi gerado com `npm run tauri -- build --debug --no-bundle`, em `src-tauri/target/debug/sweeply.exe`, com o frontend incluído. É uma prévia para revisão, dependente de WebView2; não é o instalador de produção.

## O que funciona

- Dashboard com nome do computador, Windows, CPU, RAM e discos reais, atualizados a cada 2 segundos enquanto a janela está visível.
- Processos reais, busca, ordenação por CPU/memória e histórico das últimas 30 amostras. Detalhes incluem descrição, fabricante/versão quando presentes no executável, PID, processo pai, caminho e tempo em execução. Encerramento confirmado e restrito a aplicativos não protegidos do usuário/sessão atuais.
- Resultados e pasta aberta preservados ao trocar de aba; leitura em segundo plano continua. Cache por unidade durante a sessão, com opção de desativar e reanálise manual. Fechar o aplicativo descarta os resultados.
- Análise completa das unidades detectadas, com andamento real (arquivos, pastas, bytes, tempo e pasta atual) e cancelamento. Sunburst com zoom animado por pasta e retorno pelo centro, lista dos maiores itens, cópia de caminho e abertura de localização.
- Leitura completa de `%TEMP%` e da pasta Temp do Windows, com Prefetch opcional. Revisão de arquivos antigos e exclusão confirmada. Nenhum arquivo vem selecionado nem há limpeza ao abrir.
- Consulta e esvaziamento separado da Lixeira pela API oficial, com confirmação do Windows.
- Atalhos para ferramentas oficiais de inicialização, diagnóstico, segurança, atualização, rede e armazenamento do Windows.
- Temas escuro, claro e do sistema, preferência de animação e sidebar recolhível, salvos localmente.
- Assistente IA identificado como **Em breve**, sem conexão externa, credenciais ou respostas simuladas.
- Catálogo vivo: botão de componentes na barra superior, ou `http://127.0.0.1:1420/#design-system`.
- SVGs da marca, ícones PNG/ICO, configuração de instalador NSIS e workflow de verificação/build.

## Limpeza e segurança

As categorias de arquivos exigem pelo menos **7 dias** sem modificação: `%TEMP%` do usuário, `%WINDIR%\Temp` e, opcionalmente, arquivos `.pf` na raiz de `%WINDIR%\Prefetch`. Pastas, links, documentos, Downloads, Registro e caches de navegadores não são removidos. A pasta configurada em `%TEMP%` precisa ser local, sem redirecionamentos e se chamar Temp. Prefetch fica desmarcada por padrão e pode exigir administrador; limpar esse cache não garante ganho de desempenho.

A leitura de temporários percorre toda a árvore acessível, sem os antigos cortes de 10 mil candidatos/20 segundos/32 níveis. Verifica disponibilidade para exclusão antes de oferecer um arquivo; os bloqueados são contados à parte. A lista mostra 200 itens por vez, mas Selecionar todos abrange a análise completa. Ao terminar sem candidatos, informa que não há arquivos elegíveis; se houver pastas sem acesso, exibe a restrição. Novos temporários podem surgir e arquivos recentes continuam preservados.

A **Lixeira é uma operação separada**: consulta contagem/tamanho e solicita confirmação do próprio Windows para esvaziar a Lixeira do usuário em todas as unidades, inclusive conteúdo recente. Não usa o filtro de 7 dias. O esvaziamento é permanente e não foi executado em dados reais durante os testes. Referência: [SHEmptyRecycleBinW](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shemptyrecyclebinw).

A análise produz um plano interno com validade de 15 minutos. A interface envia apenas o ID do plano e os IDs selecionados. O Rust verifica pertencimento, idade, tamanho, modificação, links e caminho final. No Windows, abre um handle que bloqueia escrita/renomeação concorrentes e exclui pelo mesmo handle. Arquivos em uso e pontos de reanálise são ignorados. A exclusão é **permanente**, sempre precedida de revisão e confirmação. O resultado informa bytes lógicos removidos; o espaço físico recuperado depende de compressão, alocação e outros fatores.

Logs locais resumidos em `%LOCALAPPDATA%\app.sweeply.desktop\cleanup.log`, sem nomes de arquivos. Limpeza requer que o log possa ser aberto e sincronizado antes da exclusão. Quando ultrapassa 1 MB, deve ser arquivado manualmente antes de nova operação.

O aplicativo não expõe shell arbitrário, não usa plugins de HTTP/filesystem/shell e não executa com administrador por padrão. As operações principais funcionam offline. Não existe telemetria.

**Encerrar processos:** a ação é forçada e pode perder trabalhos não salvos. Exige confirmação e confere novamente a identidade de criação do processo por um handle do Windows, evitando encerrar um PID reutilizado. Processos críticos, executáveis do Windows, serviços/outros usuários, outras sessões, WebView2 e o próprio Sweeply são bloqueados. Não há elevação nem encerramento em árvore. Os testes só encerram um subprocesso próprio, criado especificamente como fixture. Metadados de descrição/fabricante vêm do arquivo e não equivalem a assinatura verificada.

## Verificar e compilar

```powershell
npm run build
npm run lint
npm test
cargo test --lib --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
npm run tauri build
```

O instalador NSIS é gerado em `src-tauri/target/release/bundle/nsis/`; o executável fica em `src-tauri/target/release/sweeply.exe`. Ele depende de WebView2 instalado. O instalador pode baixar o runtime quando faltar, exigindo rede nessa etapa. Consulte a [documentação de distribuição do Tauri](https://v2.tauri.app/distribute/windows-installer/).

**Não há certificação de portabilidade:** executar o EXE solto ainda precisa ser validado em Windows 10/11 limpos. Os builds não têm certificado Authenticode do Windows, portanto reputação do SmartScreen ainda não está estabelecida. O app avisa sobre novas releases do GitHub e instala pacotes assinados após confirmação. Veja [publicação de versões](releases.md).

## Estrutura e documentação

- `src/features/`: telas; `src/design-system/`: componentes; `src/themes/`: tokens; `src/services/native.ts`: contratos IPC.
- `src-tauri/src/`: monitoramento, armazenamento, limpeza e atalhos tipados.
- [Identidade e design system](design-system.md).
- [Arquitetura e limites](architecture.md).
- [Contribuição](../CONTRIBUTING.md).
