# ENFOQUE MAPA — CONTROL CENTER 3D

Fase 1: duas salas, seis personagens cartoon 100% procedurais, câmera orbital livre e checagem real de serviços systemd na VPS da Enfoque. O GitHub é a fonte oficial; sua cópia local é atualizada com git pull.

## Executar no Windows

1. Na Área de Trabalho, abra a pasta Mapa clonada deste repositório.
2. Dê dois cliques em **Iniciar Mapa.bat**. O script prepara automaticamente as bibliotecas Python dentro de .venv (somente na primeira vez), inicia o FastAPI em http://127.0.0.1:47831 e abre o navegador.
3. Na tela de boas-vindas, clique em **INICIAR EXPERIÊNCIA** para entrar no escritório 3D.
4. Arraste para orbitar; use scroll ou pinça para zoom; botão direito ou Shift+arrastar para pan; duplo clique para focar. No rodapé, ajuste o FOV e a qualidade.
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
- web/assets/character.js: corpos, rosto, roupas, cabelo, acessórios, expressões e animações gerados por código. Não usa BoxGeometry em personagens.
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
