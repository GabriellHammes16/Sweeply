# PROJETO: SWEEPLY — BRANDING, DESIGN SYSTEM E APLICATIVO DESKTOP

Você é um agente sênior especializado em desenvolvimento de aplicativos desktop, arquitetura de software, UI/UX Design, identidade visual, design systems e aplicações Windows.

Sua missão é projetar e implementar o **Sweeply**, um aplicativo desktop gratuito, portátil e open source para Windows 10 e 11, destinado à limpeza, otimização, monitoramento e diagnóstico de computadores.

O Sweeply deve combinar uma identidade visual própria, uma interface extremamente intuitiva e ferramentas reais de manutenção do Windows.

**IMPORTANTE:** Trabalhe com autonomia. Inspecione o repositório antes de começar, planeje a arquitetura, implemente as funcionalidades em etapas, execute testes e corrija os problemas encontrados. Não fique solicitando confirmação para decisões técnicas simples. Preserve qualquer código existente e evite alterações destrutivas.

Não entregue apenas mockups: implemente componentes e interfaces funcionais, com arquitetura preparada para receber os serviços nativos do Windows.

---

# 1. VISÃO DO PRODUTO

**Nome:** Sweeply

**Slogan:** Seu PC, mais leve.

**Plataforma:** Windows 10 e Windows 11.

**Licenciamento:** Open source, com escolha de licença apropriada antes da publicação.

**Objetivo:** oferecer uma ferramenta moderna que permita a qualquer pessoa analisar, limpar, monitorar e realizar manutenção no computador sem precisar conhecer comandos avançados do Windows.

## Princípios fundamentais

1. Simplicidade acima da complexidade.
2. Design minimalista e funcional.
3. Informações fáceis de compreender.
4. Transparência sobre cada ação executada.
5. Segurança e privacidade por padrão.
6. Nenhuma otimização falsa ou enganosa.
7. Acesso a recursos avançados sem poluir a interface.
8. Funcionamento local e offline nas funcionalidades principais.
9. Arquitetura modular e extensível.
10. Excelente desempenho e baixo consumo de recursos.

O Sweeply deve transmitir a sensação de um aplicativo profissional, confiável, leve e cuidadosamente projetado.

---

# 2. TECNOLOGIAS

Utilize preferencialmente:

**Aplicativo desktop**

- Tauri 2
- Rust
- React
- TypeScript
- Vite

**Interface**

- Tailwind CSS
- Lucide Icons
- Motion para animações discretas
- Componentes personalizados e acessíveis
- SVG para gráficos e indicadores
- Recharts ou D3.js para visualizações complexas, quando necessário

**Sistema operacional**

- APIs nativas do Windows
- PowerShell apenas quando apropriado
- Windows Management Instrumentation (WMI/CIM)
- Bibliotecas Rust consolidadas e mantidas

**Qualidade**

- ESLint
- Prettier
- Testes unitários
- Testes de integração
- GitHub Actions

Verifique versões estáveis e compatibilidade entre as bibliotecas antes de instalar dependências.

Priorize desempenho, segurança, manutenção e tamanho reduzido do executável.

---

# 3. IDENTIDADE VISUAL — SWEEPLY

Crie uma identidade visual original e consistente.

O Sweeply não deve parecer um aplicativo genérico de limpeza de PC, tampouco um dashboard administrativo ou uma interface artificial excessivamente decorada.

## Personalidade da marca

- Minimalista
- Moderna
- Tecnológica
- Organizada
- Confiável
- Amigável
- Sofisticada
- Discreta

A identidade deve comunicar limpeza, organização, controle e fluidez.

## Logotipo

Crie um logotipo original composto por símbolo e wordmark.

O símbolo deve:

- Ser reconhecível em tamanhos pequenos.
- Funcionar em uma única cor.
- Funcionar sobre fundos claros e escuros.
- Ser adequado à barra de tarefas do Windows.
- Ter uma silhueta distinta.
- Representar organização, limpeza digital ou movimento fluido de maneira abstrata.

Evite símbolos óbvios como foguetes, raios, escudos, vassouras genéricas ou computadores com engrenagens.

Produza:

- Logotipo horizontal.
- Logotipo vertical.
- Símbolo isolado.
- Versões monocromáticas.
- Versões para os temas claro e escuro.
- Ícone de aplicativo.
- Arquivos SVG.
- PNGs em resoluções apropriadas.
- Arquivo ICO para Windows.

Não copie logotipos de marcas existentes.

---

# 4. TIPOGRAFIA

Fonte principal: **Inter**.

Utilizar uma hierarquia clara:

- Display: 32 px / semibold.
- H1: 28 px / semibold.
- H2: 22 px / semibold.
- H3: 18 px / medium.
- Body: 14–16 px / regular.
- Labels: 12–13 px / medium.
- Dados importantes: 24–32 px / semibold.

Utilizar números tabulares nos indicadores de CPU, RAM, armazenamento e outras métricas.

Evitar texto excessivamente pequeno.

Manter contraste adequado e acessibilidade visual.

---

# 5. SISTEMA DE CORES

O Sweeply deve possuir dois temas completos.

## 5.1 DARK MODE — PADRÃO

Tema escuro elegante, baseado em grafite e tons neutros.

Paleta inicial:

- Background principal: `#202226`
- Sidebar: `#191B1E`
- Superfície de cards: `#303238`
- Superfície elevada: `#383B41`
- Texto principal: `#F5F5F5`
- Texto secundário: `#A9ADB4`
- Bordas: `#41444B`

Evitar preto absoluto em grandes superfícies.

Utilizar ícones brancos ou cinza-claro, com contraste adequado.

Evitar efeitos neon, gradientes fortes e sombras dramáticas.

## 5.2 LIGHT MODE — LIQUID GLASS INSPIRED

Criar um tema claro inspirado nos princípios visuais do Liquid Glass da Apple, sem copiar diretamente elementos proprietários da marca.

Paleta inicial:

- Background principal: `#E8EDF0`
- Background secundário: `#F3F5F7`
- Superfícies: branco translúcido
- Texto principal: `#242B32`
- Texto secundário: `#667582`
- Bordas: branco translúcido e cinza suave

Características:

- Transparência moderada.
- Backdrop blur aplicado seletivamente.
- Sombras delicadas.
- Bordas sutis.
- Sensação de profundidade.
- Superfícies limpas.
- Excelente legibilidade.

Não aplicar efeito de vidro em todos os componentes.

Utilizar fallback para sistemas com transparência desativada e para ambientes com limitações de desempenho.

## 5.3 CORES FUNCIONAIS

As cores de destaque devem comunicar informações específicas.

**CPU**

- Laranja suave: `#E9AB70`

**Memória RAM**

- Azul: `#75A9DF`

**Armazenamento**

- Verde-água: `#70BCA3`

**Estados**

- Sucesso: verde.
- Atenção: âmbar.
- Erro: vermelho discreto.
- Informação: azul.

As cores funcionais não devem dominar a interface.

---

# 6. DESIGN SYSTEM

Crie um design system completo, reutilizável e documentado.

## Espaçamentos

Utilize uma escala baseada em 4 px:

`4, 8, 12, 16, 24, 32, 40, 48`

Evite componentes excessivamente próximos uns dos outros.

Priorize o uso de espaço vazio como ferramenta de organização.

## Border radius

- Botões: 8 px.
- Inputs: 8 px.
- Cards pequenos: 12 px.
- Cards grandes: 16 px.
- Modais: 16 px.

Evitar arredondamentos exagerados.

## Componentes

Implemente:

- Buttons
- Icon Buttons
- Cards
- Inputs
- Switches
- Checkboxes
- Tabs
- Dropdowns
- Tooltips
- Popovers
- Dialogs
- Progress Bars
- Status Indicators
- Toast Notifications
- Skeleton Loaders
- Empty States
- Error States
- Sidebar
- Navigation Items
- Search Input
- Theme Switcher
- Circular Indicators
- Data Tables
- Charts
- Confirmations

Todos os componentes devem funcionar nos dois temas.

Implementar estados de hover, focus, active, disabled e loading.

Garantir navegação por teclado, contraste adequado e suporte a movimento reduzido.

---

# 7. LAYOUT DO APLICATIVO

Criar uma aplicação desktop com sidebar à esquerda e área principal de conteúdo.

A interface deve ser limpa e organizada.

## Sidebar

Itens principais:

1. Início
2. Limpeza
3. Armazenamento
4. Desempenho
5. Ferramentas

Itens inferiores:

6. Assistente IA — Em breve
7. Configurações

A sidebar deve possuir:

- Logotipo Sweeply na parte superior.
- Ícones Lucide consistentes.
- Item ativo claramente identificado.
- Espaçamento confortável.
- Possibilidade de recolhimento.
- Transições discretas.

Não utilizar excesso de divisores e grupos.

## Área principal

- Título da página.
- Pequena descrição quando necessária.
- Ação principal em destaque.
- Informações importantes primeiro.
- Detalhes avançados em seções expansíveis.

A interface deve se adaptar a diferentes tamanhos de janela, incluindo resoluções menores.

---

# 8. DASHBOARD — PÁGINA INICIAL

A tela inicial deve responder rapidamente a três perguntas:

1. Como está meu computador?
2. Existe algo que precisa de atenção?
3. O que posso fazer agora?

## Conteúdo

Mostrar:

- Nome do computador.
- Versão do Windows.
- Estado geral do sistema.
- Uso atual de CPU.
- Uso atual de memória RAM.
- Armazenamento disponível.
- Botão principal: **Analisar PC**.

Criar três indicadores compactos:

### CPU

- Uso percentual.
- Cor laranja.
- Atualização periódica.
- Acesso aos processos mais exigentes.

### RAM

- Memória utilizada.
- Memória total.
- Cor azul.
- Acesso aos processos que mais consomem memória.

### Armazenamento

- Espaço utilizado.
- Espaço livre.
- Capacidade total.
- Cor verde-água.
- Acesso direto à análise dos discos.

Não apresentar dezenas de gráficos simultaneamente.

---

# 9. LIMPEZA DO COMPUTADOR

Criar uma experiência dividida em três etapas.

## Etapa 1 — Analisar

O usuário clica em "Analisar".

O Sweeply identifica arquivos potencialmente descartáveis em categorias aprovadas.

Categorias:

- Arquivos temporários do usuário.
- Arquivos temporários do Windows.
- Cache de miniaturas.
- Relatórios antigos e arquivos de diagnóstico descartáveis.
- Lixeira.
- Cache de navegadores.
- Arquivos de atualização descartáveis por métodos oficiais do Windows.

## Etapa 2 — Revisar

Apresentar:

- Total potencialmente recuperável.
- Categorias encontradas.
- Quantidade de arquivos.
- Espaço ocupado.
- Nível de risco.
- Itens selecionados.
- Itens excluídos da limpeza.

Permitir expandir as categorias e revisar os itens.

Não selecionar automaticamente dados pessoais, downloads ou arquivos de usuário.

## Etapa 3 — Limpar

Executar somente as ações confirmadas.

Mostrar:

- Progresso.
- Arquivos processados.
- Espaço efetivamente liberado.
- Itens ignorados.
- Erros encontrados.

Nunca prometer liberar um tamanho exato antes da execução.

Não excluir arquivos em uso nem tentar forçar a remoção de dados protegidos.

Implementar logs e tratamento de erros.

---

# 10. INDICADORES CIRCULARES

Criar indicadores circulares modernos e minimalistas.

Utilizar Segmented Donut Charts quando apropriado.

Características:

- Segmentos visualmente separados.
- Lacunas de aproximadamente 3–5 px.
- Extremidades suavemente arredondadas.
- Centro livre para os dados principais.
- Sem sombras exageradas.
- Sem efeitos 3D.
- Sem gradientes decorativos.

As lacunas devem utilizar a cor do fundo correspondente ao tema.

Os segmentos precisam representar dados reais.

Garantir que as separações não causem distorções na interpretação dos valores.

---

# 11. ANÁLISE DE ARMAZENAMENTO — SUNBURST

Esta é uma das funcionalidades mais importantes do Sweeply.

Criar uma página dedicada à análise visual do armazenamento.

## Seleção de discos

Detectar unidades disponíveis no Windows.

Mostrar:

- Nome da unidade.
- Letra.
- Capacidade total.
- Espaço usado.
- Espaço livre.
- Tipo de unidade quando disponível.

Permitir selecionar a unidade que será analisada.

## Gráfico Sunburst

Criar um gráfico circular hierárquico e interativo.

No centro:

- Nome do disco selecionado.
- Espaço utilizado.
- Capacidade total.
- Porcentagem ocupada.

Os anéis devem representar:

- Pastas principais.
- Subpastas.
- Arquivos.

As fatias devem ter tamanhos proporcionais ao espaço ocupado.

## Visual

- Anéis concêntricos.
- Pequenos espaços entre as fatias.
- Separação entre os anéis de aproximadamente 4–6 px.
- Cores discretas e harmoniosas.
- Centro visualmente limpo.
- Sem efeitos 3D.

Utilizar agrupamento de elementos muito pequenos para evitar poluição visual.

## Interatividade

Ao passar o mouse:

- Nome.
- Caminho.
- Tamanho.
- Porcentagem.

Ao clicar:

- Navegar para a pasta.
- Expandir subpastas.
- Atualizar a visualização.
- Permitir voltar ao nível anterior.

## Painel lateral

Listar os maiores arquivos e diretórios.

Mostrar:

- Nome.
- Tamanho.
- Localização.
- Porcentagem ocupada.

Ações:

- Abrir localização.
- Copiar caminho.
- Analisar pasta.
- Selecionar arquivo para possível remoção.

Não permitir exclusões destrutivas sem confirmação.

Diferenciar arquivos protegidos do sistema e arquivos comuns.

Não tentar excluir arquivos apenas porque são grandes.

---

# 12. DESEMPENHO

Criar uma página de monitoramento.

## CPU

- Uso geral.
- Processos com maior consumo.
- Histórico curto de utilização.

## Memória RAM

- Memória total.
- Memória em uso.
- Memória disponível.
- Lista dos processos com maior consumo.

## Processos

Permitir:

- Visualizar processos.
- Ordenar por CPU.
- Ordenar por RAM.
- Abrir localização do executável.
- Encerrar processos selecionados após confirmação.

Proteja processos essenciais do sistema.

Não implementar ferramentas agressivas de "limpeza de RAM".

Não forçar esvaziamento de caches de memória nem manipular working sets indiscriminadamente.

O Windows já gerencia a memória automaticamente.

---

# 13. FERRAMENTAS

Agrupar funcionalidades avançadas em uma única página.

Criar seções organizadas.

## Inicialização

- Listar aplicativos de inicialização.
- Mostrar nome e origem.
- Permitir desabilitar itens suportados.
- Permitir reabilitar itens desabilitados.

Evitar alterações irreversíveis.

## Diagnóstico

- SFC.
- DISM.
- Verificação do disco.
- Informações de hardware.
- Verificação do estado geral do Windows.

Utilizar mecanismos oficiais e seguros do sistema.

Mostrar claramente quais ações precisam de permissões de administrador.

## Rede

- Limpeza de cache DNS.
- Diagnóstico básico de conectividade.
- Informações dos adaptadores.

Não redefinir configurações de rede automaticamente.

## Segurança

- Consultar estado do Microsoft Defender.
- Acessar opções de verificação de ameaças.
- Consultar estado de atualizações.
- Exibir recomendações de segurança.

Não desabilitar Defender, firewall ou atualizações automaticamente.

---

# 14. ASSISTENTE IA — FUTURA IMPLEMENTAÇÃO

Preparar a arquitetura para uma futura integração de inteligência artificial.

A integração não precisa funcionar na primeira versão.

## Objetivo futuro

Permitir que o usuário conecte seu próprio provedor de IA para:

- Interpretar diagnósticos.
- Explicar problemas do computador.
- Recomendar manutenções.
- Analisar consumo de recursos.
- Explicar arquivos grandes.
- Auxiliar na decisão de limpeza.
- Orientar o usuário sobre ações seguras.

## Provedores futuros

Planejar adaptadores para:

- OpenAI API.
- Anthropic API.
- Provedores compatíveis com OpenAI.
- Modelos locais por interfaces compatíveis.

Não presumir que a assinatura ChatGPT ou Claude inclui acesso às respectivas APIs.

## Arquitetura

Criar contratos e interfaces para:

- AIProvider
- AIProviderConfig
- DiagnosticContext
- SystemReport
- SuggestedAction
- ActionApproval
- ToolExecutionResult

Separar completamente o mecanismo de IA das funções de manutenção.

A IA poderá sugerir ações, mas nunca deverá executar comandos arbitrários diretamente.

Toda ação deve passar por uma lista explícita de operações permitidas e por confirmação do usuário.

Não enviar caminhos pessoais, nomes de arquivos, dados de processos ou informações sensíveis a provedores externos sem consentimento informado.

Preparar armazenamento seguro de credenciais.

## Interface

Criar uma tela inicial com:

- Nome: Assistente IA.
- Indicação: Em breve.
- Breve descrição.
- Prévia visual de seleção de provedores.

Não simular respostas de IA como se fossem funcionalidades existentes.

---

# 15. CONFIGURAÇÕES

Adicionar:

- Alternância entre tema claro e escuro.
- Preferências de animação.
- Preferências de idioma.
- Configurações de privacidade.
- Preferências de limpeza.
- Informações da versão.
- Licenças e créditos.
- Link para o GitHub.
- Verificação de atualizações, quando implementada.

O tema escuro deve ser o padrão inicial.

Salvar preferências localmente.

---

# 16. ANIMAÇÕES E MICROINTERAÇÕES

Utilizar animações discretas.

Exemplos:

- Transição suave entre telas.
- Hover sutil.
- Indicadores atualizados sem saltos visuais.
- Expansão de seções.
- Feedback de ações.
- Animação curta durante análise.

Duração recomendada:

- Microinterações: 120–180 ms.
- Transições de navegação: 180–250 ms.

Não utilizar animações exageradas nem constantes.

Respeitar configurações de movimento reduzido.

---

# 17. SEGURANÇA E PRIVACIDADE

Este é um aplicativo com potencial para modificar arquivos do computador.

Implementar segurança desde o início.

Requisitos:

- Nenhuma exclusão silenciosa de arquivos pessoais.
- Nenhuma modificação destrutiva sem confirmação.
- Nenhuma exclusão automática de arquivos do sistema.
- Nenhuma limpeza automática do Registro do Windows.
- Nenhuma desativação de serviços essenciais.
- Nenhuma alteração agressiva de configurações de energia.
- Nenhuma promessa de aumento artificial de FPS.
- Nenhuma execução arbitrária de comandos vindos da interface ou da IA.
- Nenhum uso de shell com argumentos não validados.
- Nenhuma elevação administrativa permanente sem necessidade.
- Nenhuma coleta de dados pessoais sem consentimento.

Separar análise, planejamento e execução das ações.

Adicionar logs locais, pré-visualização e mensagens claras sobre riscos.

Preferir APIs oficiais do Windows.

Executar ações privilegiadas somente quando necessário.

---

# 18. ARQUITETURA

Organize o projeto de maneira modular.

Estrutura sugerida:

sweeply/

- src/
  - app/
  - components/
  - design-system/
  - features/
    - dashboard/
    - cleanup/
    - storage/
    - performance/
    - tools/
    - ai-assistant/
    - settings/
  - hooks/
  - services/
  - themes/
  - types/
  - assets/
- src-tauri/
  - src/
    - system/
    - cleanup/
    - storage/
    - diagnostics/
    - processes/
    - security/
- branding/
  - logos/
  - icons/
  - color-palette/
  - typography/
- docs/
- tests/
- .github/
  - workflows/

Adapte essa estrutura se identificar uma alternativa tecnicamente superior.

Evite abstrações desnecessárias.

---

# 19. BRANDING E DOCUMENTAÇÃO

Criar documentação em Markdown contendo:

- Visão da marca.
- Conceito do logotipo.
- Paleta de cores.
- Tipografia.
- Espaçamentos.
- Componentes.
- Regras de utilização de ícones.
- Regras dos temas claro e escuro.
- Exemplos de telas.
- Diretrizes de acessibilidade.
- Diretrizes de microinterações.

Criar um catálogo visual dos componentes, utilizando uma solução apropriada ao projeto.

Disponibilizar recursos visuais reutilizáveis.

---

# 20. EXPERIÊNCIA DE PRIMEIRA EXECUÇÃO

O Sweeply deve funcionar de maneira intuitiva logo após ser aberto.

Fluxo recomendado:

1. Abrir o aplicativo.
2. Detectar informações básicas do computador.
3. Exibir dashboard.
4. Permitir analisar o sistema.
5. Exibir resultados.
6. Permitir revisar recomendações.
7. Executar somente as ações aprovadas.
8. Exibir relatório final.

Não exigir login.

Não exigir conexão com a internet para utilizar as funcionalidades principais.

Não executar limpeza automaticamente na primeira abertura.

---

# 21. BUILD E DISTRIBUIÇÃO

Preparar o aplicativo para publicação no GitHub.

Objetivos:

- Build de produção para Windows.
- Instalador Windows.
- Distribuição portátil quando tecnicamente viável.
- Ícones corretos.
- Metadados do executável.
- Pipeline GitHub Actions.
- Releases versionadas.
- README profissional.
- Instruções de compilação.
- Instruções de contribuição.

Verificar dependências de runtime do Tauri, incluindo WebView2, e documentar eventuais requisitos.

Não afirmar que o aplicativo é completamente portátil antes de testar a distribuição.

---

# 22. ORDEM DE IMPLEMENTAÇÃO

Execute o trabalho por fases.

**Fase 1 — Fundação**

- Inspecionar o repositório.
- Configurar tecnologias.
- Criar arquitetura.
- Configurar qualidade e testes.

**Fase 2 — Branding**

- Desenvolver propostas de logotipo.
- Definir identidade visual.
- Criar paleta.
- Implementar tipografia.
- Criar ícones do aplicativo.

**Fase 3 — Design system**

- Criar tokens.
- Implementar os dois temas.
- Criar componentes reutilizáveis.
- Construir navegação e layout.

**Fase 4 — Interface**

- Dashboard.
- Limpeza.
- Armazenamento.
- Desempenho.
- Ferramentas.
- Configurações.
- Placeholder do Assistente IA.

**Fase 5 — Funcionalidades nativas**

- Monitoramento do computador.
- Análise de temporários.
- Análise de armazenamento.
- Gerenciamento de processos.
- Diagnósticos suportados.

**Fase 6 — Segurança e testes**

- Revisar ações destrutivas.
- Testar permissões.
- Testar os temas.
- Corrigir problemas.
- Validar desempenho e acessibilidade.

**Fase 7 — Distribuição**

- Compilar aplicativo.
- Validar execução em ambiente limpo.
- Preparar Release.
- Documentar limitações.

Não tratar todas as fases como concluídas se houver funcionalidades apenas simuladas.

---

# 23. CRITÉRIOS DE QUALIDADE

Antes de considerar uma etapa concluída:

- Verifique erros de TypeScript.
- Execute lint.
- Execute testes disponíveis.
- Verifique erros de compilação Rust.
- Confirme que componentes renderizam corretamente.
- Verifique contraste dos dois temas.
- Teste estados de erro e carregamento.
- Não deixe botões sem comportamento sem identificá-los claramente como indisponíveis.
- Não apresente métricas fictícias como dados reais.
- Verifique se as funcionalidades funcionam sem internet.
- Documente limitações conhecidas.

Se não for possível testar uma funcionalidade, registre explicitamente essa limitação.

---

# 24. DIRETRIZES FINAIS

A principal referência de qualidade é a simplicidade de aplicativos como Linear e Raycast, adaptada à identidade original do Sweeply.

Não copie diretamente seus layouts.

Evite:

- Excesso de cards.
- Interfaces excessivamente compactas.
- Espaçamentos inconsistentes.
- Efeitos neon.
- Gradientes exagerados.
- Ícones desproporcionais.
- Tipografia minúscula.
- Gráficos decorativos sem utilidade.
- Excesso de informações na tela inicial.
- Funcionalidades fictícias apresentadas como reais.

Prefira:

- Interface limpa.
- Elementos bem espaçados.
- Ações óbvias.
- Boa legibilidade.
- Navegação intuitiva.
- Feedback claro.
- Design consistente.
- Segurança.
- Desempenho.
- Código bem estruturado.

**REGRA PRINCIPAL:**

O Sweeply deve ser simples para iniciantes, útil para usuários avançados e seguro para ambos.

Comece inspecionando o ambiente e o repositório. Depois, estabeleça a fundação técnica, crie a identidade visual e o design system e implemente progressivamente as telas e funcionalidades.

Ao finalizar cada etapa, documente o que foi implementado, o que foi testado e o que ainda falta.

Não invente resultados de testes nem afirme que funcionalidades estão operacionais quando ainda forem apenas interfaces.

O resultado esperado é um projeto Sweeply original, funcional, moderno, open source e preparado para evoluir.
