# Enfoque Mapa v0.5 — escritório 3D e computadores

Mapa local dos serviços da VPS, somente leitura. Mantém um andar com as salas Enfoque OS e Infraestrutura, personagens e mesas. A visualização de computadores agora é uma lista simples, aberta por um aviso na parede.

## Como usar

- Abra a pasta Mapa na Área de Trabalho e execute Iniciar Mapa.bat. O programa utiliza http://127.0.0.1:47831. Não inicia com o Windows. O script não abre outra instância se a porta já estiver ocupada.
- Aparelhos na mesma rede privada podem acessar http://IP-LOCAL-DO-DESKTOP:47831 enquanto a aplicação está aberta. O Firewall restringe a porta TCP 47831 à sub-rede local privada. Não abra portas no roteador.
- Use arrastar, zoom e duplo clique para explorar o escritório. As sidebars esquerda e direita começam recolhidas e oferecem navegação e detalhes.
- Na sala Enfoque OS, clique no aviso Computadores fixado à parede, ou use o atalho ▤ no menu esquerdo. A câmera se aproxima e abre um painel simples, com as colunas Empresa / loja, Computador e Status. Role a tabela para navegar por todos os equipamentos. Use Esc ou Voltar ao escritório para sair.
- Clique em uma linha para consultar o último sinal do agente e, se desejar, ocultar aquele computador apenas neste mapa. A lista de itens ocultos no menu lateral restaura os registros. Ocultar pessoas mantém suas mesas no cenário.

## Interpretação do status

- Online: conexão recente e verificável do agente de controle remoto com o servidor.
- Offline: o agente já foi observado, mas sua sessão não está ativa ou o heartbeat expirou.
- Sem sinal: não existe informação de comunicação confiável ou o sinal de um estado informado como online está antigo. Nunca é convertido automaticamente para offline.

Importante: um computador pode estar ligado, mas o agente remoto estar parado; nesse caso a lista não confirma o estado físico da máquina. Um computador com agente conectado pode ter outros programas parados. A interface verifica o sinal já coletado pelo Root MCP, sem disparar sondagens nem comandos nas máquinas. O status recebe atualização via WebSocket periodicamente. O último contato pode ser consultado ao selecionar uma linha.

## Arquitetura e segurança

- backend/app.py: FastAPI local, conexão HTTPS autenticada com a VPS, validação do heartbeat, API somente leitura e WebSocket.
- web/assets/world.js: único andar 3D, câmera e isolamento do aviso.
- web/assets/poster.js: aviso planar na parede, gerado em Three.js sem ativos externos.
- web/assets/main.js: tabela HTML responsiva de computadores, interface e estado de ocultação local.
- web/index.html e web/assets/style.css: layout da tabela e sidebars.
- config/projects.yaml: configuração das salas e serviços.
- server/: referências da ponte somente leitura na VPS.

O token de acesso fica em config.local.json (ignorado pelo Git). A interface não implementa comandos remotos, movimentação de computadores, criação ou gravação de dados na VPS. Ocultações são locais ao navegador (localStorage, chave enfoque-mapa-visual-hidden-v3). Outros aparelhos usam seus próprios ajustes de ocultação.

## Desenvolvimento

Execute python -m unittest discover -s tests -v na pasta do Mapa, e node --check nos arquivos JS quando houver Node disponível. O Three.js é incluído no repositório. Fluxo de atualização: main no GitHub tecnologia-en/mapa e depois git pull --ff-only na pasta do desktop.
