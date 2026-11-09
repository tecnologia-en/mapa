# ENFOQUE MAPA — CONTROL CENTER 3D

Fase 1 + melhorias: duas salas, seis personagens cartoon, câmera orbital livre, quintal com pets procedurais e status reais da VPS. O GitHub é a fonte oficial; sua cópia local é atualizada com git pull.

## Executar no Windows

1. Na Área de Trabalho, abra a pasta Mapa clonada deste repositório.
2. Dê dois cliques em **Iniciar Mapa.bat**. O script prepara automaticamente as bibliotecas Python dentro de .venv (somente na primeira vez), inicia o FastAPI em http://127.0.0.1:47831 e abre o navegador.
3. O escritorio 3D abre automaticamente na pagina, sem tela de boas-vindas.
4. Arraste para orbitar; use scroll/pinca para zoom; botao direito ou Shift+arrastar para pan; duplo clique para aproximar. Clique numa sala e em Focar esta equipe para ocultar as demais; clique em Voltar ao predio para sair do foco. O botao ☰ recolhe/expande a sidebar.
5. Para encerrar, feche a janela do prompt aberta pelo .bat. **O programa não inicia com o Windows.**

Requisitos: Windows, Python 3 e navegador com WebGL. O Three.js 0.160.1 já está incluído no repositório. **Nenhum modelo 3D, textura, imagem ou pacote gráfico é baixado**; tudo é gerado por código. Licença do motor em LICENSE-THREE.txt.

## Atualização pelo GitHub

Repositório canônico: https://github.com/tecnologia-en/mapa (branch main). Pasta de testes no desktop: Área de Trabalho/Mapa.

Fluxo: editar projeto → commit/push no GitHub → git pull --ff-only na pasta Mapa → testar. Também é possível executar **Atualizar Mapa.bat**.

Não use git reset --hard para atualizar, e não altere o código da cópia local durante o ciclo oficial de publicação.

## Estrutura

- backend/app.py: FastAPI local em 127.0.0.1:47831, REST e WebSocket com atualização a cada 8 segundos.
- config/projects.yaml: salas, personagens, roupas e identificadores dos serviços.
- web/index.html: tela inicial e painel de inspeção.
- web/assets/pet.js: cachorros e gatos procedurais, sentados quando online e dormindo quando offline.\n- web/assets/character.js: corpos, rosto, roupas, cabelo, acessórios, expressões e animações gerados por código. Não usa BoxGeometry em personagens.
- web/assets/world.js: prédio, salas, móveis, câmera livre, iluminação e pisos procedurais.
- web/assets/main.js: interface, busca e conexão WebSocket.
- web/assets/style.css: apresentação responsiva.
- web/assets/three.module.js: biblioteca Three.js MIT vendorizada (sem CDN).
- config.local.json: credencial local da VPS, ignorada pelo Git.

## Dados reais e segurança

Cada personagem representa um serviço systemd concreto, identificado por check_id no YAML. A API segura na VPS consulta somente uma lista permitida usando systemctl is-active e envia os estados por HTTPS autenticado. O FastAPI local repassa apenas os estados e os dados de apresentação.

Serviços monitorados nesta fase: enfoque-os-remote, enfoque-agent-api, enfoque-os-oidc, nginx, chatgpt-mcp, enfoque-vpn-monitor.

Se a VPS ficar inacessível, todos os personagens aparecem como **não verificados**, nunca online fictício. O estado "ativo" significa apenas systemctl is-active=active, não que o serviço processa uma tarefa agora.

Não há controle de computadores, terminal, mudança de serviços nem tarefas agendadas. O repositório é público: não publicar tokens, IPs internos, inventários ou arquivos pessoais. O token fica somente em config.local.json no desktop e em arquivo protegido na VPS.

## Estado das fases

**Fase 1 (esta entrega):** duas salas, seis personagens distintos com rosto e animações, mobília, câmera livre com FOV, pan, zoom, duplo clique, paredes transparentes, painel de detalhes, busca, WebSocket e seis status reais.

**Fase 2 (pendente):** expansão do YAML, dependências animadas, painel de CPU/memória/logs, checagem Docker, processos, arquivos, portas e cron.

**Fase 3 (pendente):** descoberta automática, propostas para aprovação, histórico SQLite, impacto de falhas, alertas, ações autorizadas com confirmação, pós-processamento opcional.


## Nova etapa: quintal, pets e interface

- Nao existe mais menu de inicio; a aplicacao abre direto na cena tridimensional.
- Sidebar esquerda retratil. A selecao de uma sala exibe o botao Focar esta equipe.
- Foco exclusivo vale somente para uma sala: esconde temporariamente outros ambientes em 3D, mas preserva o quintal da equipe Enfoque OS.
- Quintal anexado ao Enfoque OS com grupos de caes e gatos, ordenados por loja/empresa registrada; cada animal corresponde a um computador aprovado (com deduplicacao de varios agentes da mesma maquina).
- Online: conexao ativa do agente ou heartbeat recente existente; o pet fica sentado. Offline: ja havia sinal e ele expirou; o pet dorme. Sem sinal: ainda nao ha confirmacao, a animacao permanece neutra. Os animais nao causam pings, execucao remota ou processos novos nos PCs.
- O gateway root MCP possui uma pequena rota read-only, restrita a 127.0.0.1 e protegida com o token da ponte Mapa. A rota entrega apenas nome de apresentacao, loja, ID aleatorio derivado, estado e horario do ultimo sinal. Tokens, nomes de usuario, IPs, comandos e identificadores brutos nao sao publicados.
- A API da VPS mantem cache de 5 segundos; o backend local recebe os dados na mesma resposta ja usada para os estados systemd e publica pelo WebSocket existente a cada 8 segundos.
- Caso o servidor pare de responder, os animais anteriormente conhecidos passam a estado desconhecido, sem mostrar verde falso.
- Modulos de interface: web/assets/main.js, web/assets/world.js, web/assets/pet.js, web/index.html, web/assets/style.css.
- Esta etapa nao inclui controle remoto, alteracoes de status do PC, abertura automatica no Windows ou descoberta de dispositivos pendentes.

Verificacao: python -m unittest discover -s tests; node --check nos arquivos JS (em extensao ESM).

## Arquivos versionados da integracao VPS

A pasta server/ preserva a fonte da ponte Mapa (mapa_status_bridge.py), a unidade systemd, um exemplo de rota HTTPS do Nginx e o patch minimo do Root MCP para consultar os agentes em memoria. Nao contem tokens reais. Estes arquivos documentam o deploy da integracao sem depender da memoria da conversa; aplicar alteracoes em producao somente com validacao e backup.
