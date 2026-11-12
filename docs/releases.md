# Publicar versões do Sweeply

O repositório oficial é [GabriellHammes16/Sweeply](https://github.com/GabriellHammes16/Sweeply). O workflow `release.yml` compila o instalador Windows x64, assina o pacote do atualizador e cria uma **release em rascunho** com `latest.json`. Publicar o rascunho torna a atualização disponível aos usuários. Um push de código sozinho não notifica os usuários.

## Chave de assinatura

A chave pública está em `src-tauri/tauri.conf.json`. A chave privada foi gerada localmente em `.release-keys/sweeply.key`, excluída do Git e cadastrada no secret `TAURI_SIGNING_PRIVATE_KEY` do repositório. Faça uma cópia de segurança privada dessa pasta. Nunca envie a chave por commit, issue ou README. A chave atual não tem senha; o secret opcional `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` fica ausente.

Não gere outra chave para cada versão: as instalações existentes só aceitam a chave pública embarcada. A assinatura do atualizador não é um certificado Authenticode do Windows; os instaladores ainda podem apresentar o aviso do SmartScreen.

## Primeiro envio

Após revisar o commit local e as imagens:

```powershell
git push -u origin main
git tag v1.0.0
git push origin v1.0.0
```

Espere o workflow **Signed Windows release** terminar. Em Releases, revise o rascunho, as notas e os anexos: instalador `setup.exe`, assinatura `.sig` e manifesto `latest.json`. Teste o instalador em Windows de teste antes de publicar. Uma versão ausente ou um rascunho não gera aviso no aplicativo.

## Próximas versões

Atualize a mesma versão em `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` e `src-tauri/tauri.conf.json`. Execute as verificações do README e `npm run release:check -- v1.0.1`, substituindo pela versão escolhida. Envie o commit e a tag correspondente. Não reutilize tags nem substitua anexos já publicados.

O app consulta o manifesto ao abrir (após 3 segundos) e a cada 6 horas, quando a preferência está ativa. Mostra aviso com botão **Atualizar**; só baixa e instala após confirmação. A assinatura também vincula o pacote à versão anunciada. A instalação é bloqueada enquanto uma análise/limpeza detém o bloqueio de manutenção. A instalação fecha o app e descarta análises da sessão; o usuário reabre o aplicativo depois, se o instalador não o abrir.

O download é restrito a anexos HTTPS das releases deste repositório. Preferências e análises não são enviadas; consultas ao GitHub usam a rede normalmente, expondo ao serviço os metadados usuais de uma requisição, como IP.

Referências: [atualizador Tauri](https://v2.tauri.app/plugin/updater/), [ação oficial de releases](https://github.com/tauri-apps/tauri-action).
