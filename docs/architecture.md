# Arquitetura e fronteiras

React 19 + TypeScript + Vite 8 e Tailwind 4 na WebView do Tauri 2. Rust executa as operações nativas em workers bloqueantes, sem bloquear a thread de interface. A fonte e os assets são locais. `package-lock.json` e `src-tauri/Cargo.lock` fixam a resolução usada na verificação.

## Fluxo

`tela → services/native.ts → invoke tipado → comando Rust → resultado serializado`.

O frontend não envia comandos de shell. Os comandos expostos são `system_snapshot`, `process_details`, `terminate_process`, `scan_cleanup`, `execute_cleanup`, `recycle_bin_status`, `empty_recycle_bin`, `scan_storage`, `storage_progress`, `cancel_storage`, `open_windows_tool` e `open_location`. A política CSP limita conteúdo a recursos locais e IPC. Não há permissões remotas nas capabilities nem plugins de acesso genérico.

`sysinfo` consulta CPU, memória, processos e discos. CPU de processos é dividida pelo número de CPUs lógicas. Dados podem ficar indisponíveis conforme permissões do Windows. O histórico é mantido somente na memória e amostrado com a janela visível. A primeira amostra de CPU pode estar em aquecimento.

## Processos

`process_details` atualiza o PID solicitado e consulta o executável por handle. Expõe métricas, estado, pai, início, duração e metadados de versão disponíveis (`FileDescription`, `CompanyName`, `ProductName`, `FileVersion`), sem enviar argumentos de linha de comando ou ambiente que podem conter segredos. Recursos de versão têm limites de tamanho e validação de ponteiros/comprimento. Campos ausentes são apresentados como não informados.

`terminate_process` exige confirmação e identidade de criação em precisão FILETIME, obtida na revisão. Reabre com direitos mínimos de consulta/encerramento/sincronização, compara a identidade e usa esse mesmo handle para o encerramento e espera. Bloqueia processos essenciais por PID/nome/caminho, verifica `IsProcessCritical`, compara SID do token e sessão com o usuário atual e protege Sweeply/WebView2. Falha na verificação implica bloqueio. Sem elevação, shell ou encerramento em árvore. O log é sincronizado antes da ação e registra PID/resultado, sem caminho ou nome pessoal.

O encerramento é forçado e a interface avisa sobre perda de trabalho não salvo. A solicitação e a confirmação de término são diferenciadas; espera de até 2 s evita declarar encerrado um processo que ainda está finalizando. Testes usam somente um subprocesso isolado do próprio executável de teste. A fixture aparece ignorada na execução normal porque só deve rodar como subprocesso do teste de encerramento.

## Limpeza

Plano em memória, sem caminhos aceitos do frontend, validade de 15 minutos a partir do fim da análise e IDs validados. Um mutex serializa análises e execução. Categorias tipadas são resolvidas pelo backend para `%TEMP%`, `%WINDIR%\Temp` e `%WINDIR%\Prefetch`. A leitura de temporários percorre toda a árvore acessível, sem cortes por tempo, quantidade ou profundidade; diretórios sobrepostos são visitados uma vez. A lista da interface é paginada em lotes de 200, mantendo a seleção de todos os candidatos.

Arquivos devem ter 7 dias de idade, ser regulares, graváveis e não ser pontos de reanálise. Prefetch só inclui `.pf` da raiz, sem metadados ou subpastas. A leitura já tenta abrir o mesmo tipo de handle exigido na exclusão, e itens indisponíveis são separados da lista removível. Antes da exclusão, tudo é revalidado. No Windows, o handle é aberto com DELETE/FILE_READ_ATTRIBUTES, FILE_FLAG_OPEN_REPARSE_POINT e compartilhamento apenas de leitura: arquivos em uso/escrita ou renomeação conflitante falham. Metadata e caminho final são checados pelo handle; a exclusão usa `SetFileInformationByHandle`. Não se excluem diretórios. O plano é consumido na execução e não pode ser reutilizado. A validade é checada antes do início da operação, sem expirar no meio de uma seleção já aprovada.

A Lixeira é tratada separadamente por `SHQueryRecycleBinW`/`SHEmptyRecycleBinW`, sem apagar manualmente `$Recycle.Bin`. O esvaziamento preserva a confirmação nativa: não se utiliza `SHERB_NOCONFIRMATION`. Logs resumidos são abertos antes da operação. Não há esvaziamento automático nem execução desse caminho destrutivo nos testes.

Os testes só removem fixtures temporárias criadas pelos próprios testes. Não executam limpeza da pasta temporária real do usuário. Logs resumidos não incluem caminhos pessoais; nomes e caminhos exibidos na UI não saem do computador.

## Armazenamento

Só aceita uma unidade exata da lista detectada pelo backend. Percorre todas as entradas acessíveis sem cortes por tempo, quantidade ou profundidade. A travessia usa uma pilha iterativa em worker bloqueante para não depender da pilha de chamadas nem travar a interface. Ignora links/pontos de reanálise e informa entradas inacessíveis. Usa os metadados de `DirEntry` (baratos no Windows), sem abrir o conteúdo dos arquivos; revalida diretórios antes de entrar. Referência: [DirEntry::metadata](https://doc.rust-lang.org/std/fs/struct.DirEntry.html#method.metadata).

`storage_progress` fornece contagens reais, bytes lógicos, pasta atual e tempo decorrido. O worker publica no máximo a cada 250 ms; a tela consulta a cada 500 ms sem sobrepor chamadas. Não há porcentagem estimada ou limite automático de duração. `cancel_storage` solicita cancelamento cooperativo por um ID exclusivo da análise; desmontar o componente ou encerrar a sessão solicita o mesmo cancelamento. Trocar de aba apenas oculta a tela e mantém a leitura ativa. O relatório cancelado agrega os itens já lidos e é identificado como parcial. Uma chamada de I/O do Windows já em andamento precisa retornar antes do cancelamento ser processado. Erros liberam a reserva de análise para permitir nova tentativa.

Para limitar memória e ruído no gráfico, retém os maiores 128 filhos por pasta e até quatro níveis detalhados, agrupando os demais. Isso não limita a leitura: os bytes dos arquivos mais profundos e dos itens agrupados entram nos totais. O usuário navega pelos dados já coletados. Abrir localização chama o Explorer com caminho local absoluto existente, como um único argumento sem shell. Não há exclusão nessa tela.

O total é lógico e parcial em caso de erros/limites, e não equivale à ocupação física da unidade. Hardlinks podem ser contados mais de uma vez; compressão, sparse files e alocação não são deduplicados. Discos de rede não são alvo de abertura de localização. Estas limitações impedem tratar o gráfico como um inventário completo.

O sunburst interpola ângulos, raios e opacidade por 440 ms ao entrar/voltar de uma pasta, mantendo as proporções dos bytes reais. A animação ocorre somente após a chegada dos dados, não simula progresso de leitura. `requestAnimationFrame` é cancelado ao desmontar; movimento reduzido ou animações desativadas aplicam o destino diretamente. A referência é o zoom hierárquico de `Downloads/video.mp4` fornecido pelo usuário.

## Ferramentas e IA

Enumeração fechada de seis atalhos `ms-settings`/Windows Defender. Nenhuma URI livre é aceita. Recursos internos de SFC, DISM, startup, rede, Defender e atualização ainda não estão implementados; o usuário opera a ferramenta oficial que abrir.

Contratos futuros da IA estão em `src/types/ai.ts`. Nenhum provedor está ativo, nenhum segredo é salvo. Antes de integrar: consentimento granular, contexto redigido, armazenamento de chaves no Windows Credential Manager, configuração de endpoint validada e executor com allowlist/approvals. A IA nunca terá acesso a shell genérico. Não existe placeholder de credenciais inseguro.

## Evolução

Priorizar cancelamento/progresso da limpeza, paginação com inventário detalhado completo e revisão dos testes de links/junctions em múltiplas versões do Windows. Somente depois ampliar categorias de limpeza com métodos oficiais. Operações administrativas devem usar um processo auxiliar restrito e elevação pontual, nunca elevar o aplicativo inteiro por padrão.

## Estado de armazenamento na sessão

A tela de armazenamento permanece montada ao navegar entre as abas. Preserva leitura em andamento, resultado, unidade e pasta aberta. Não depende da montagem de Desempenho. Um cache em memória por unidade restaura o resultado e a trilha ao alternar o seletor; a opção Guardar resultados ao trocar de unidade nesta sessão permite desativar esse cache. A unidade só é lida quando o usuário clica em Analisar unidade ou Analisar novamente. A data da última análise identifica o snapshot. Não se grava inventário de caminhos em disco; fechar o aplicativo descarta esses resultados.

## Estado de limpeza na sessão

A tela de limpeza também permanece montada ao trocar de aba. Preserva as categorias, plano, seleção, operação em andamento e relatório final; a consulta da Lixeira é preservada junto com a tela. Navegar não analisa nem exclui novamente. A validade de 15 minutos do plano e as verificações no momento da exclusão continuam no Rust, e os resultados são descartados ao fechar o app.

## Atualizações pelo GitHub

`useUpdates` pertence ao App e continua ativo entre abas. A preferência `autoUpdates` é persistida e ativa por padrão, com consulta inicial e intervalo de seis horas. O frontend não recebe permissões genéricas do plugin: usa `check_updates` e `install_update`, com progresso por Channel IPC. A checagem guarda o objeto Update no backend e a instalação exige a mesma versão, confirmação e o bloqueio de manutenção disponível. O download aceita apenas anexos HTTPS de releases do repositório oficial; a assinatura e a versão são verificadas pelo atualizador Tauri. A chave privada não faz parte do código e só é disponibilizada ao job de release por secret. Veja [publicação](releases.md).
