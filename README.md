# Mapa v0.4 — Enfoque Control Center

Escritório 3D de um único andar, com salas de serviços e uma estante de computadores. A interface lê os estados da VPS; preferências de ocultação ficam apenas no navegador.

## Iniciar

Na Área de Trabalho do Windows, abra a pasta Mapa e execute **Iniciar Mapa.bat**. O aplicativo abre em http://127.0.0.1:47831. Se a porta estiver ocupada, o iniciador não cria uma segunda instância. Para atualizar o projeto, use **Atualizar Mapa.bat** ou git pull --ff-only.

Outros aparelhos na mesma rede local podem acessar http://IP-DO-DESKTOP:47831 quando o aplicativo estiver aberto. A regra do Firewall existente é limitada à rede privada e à sub-rede local; não configure redirecionamento da porta no roteador.

## Um andar

O prédio mostra as salas Enfoque OS e Infraestrutura. O segundo andar da Intranet, o catálogo e a escada foram removidos. Use o mouse para girar, a roda para dar zoom e botão direito/Shift+arrastar para deslocar. As duas barras laterais começam fechadas, com menus expansíveis e rolagem própria.

Ao selecionar uma pessoa ou sua mesa, o botão Ocultar esconde só a pessoa, deixando a mesa clicável para revelar quem está oculto. Tudo é apenas visual, salvo no localStorage do navegador, sem atualizar cadastros ou comandos na VPS.

## Estante de computadores

Clique na estante da sala Enfoque OS, ou no botão ▤ da sidebar, para entrar numa **visão frontal exclusiva**. Nessa visualização, todo o cenário do prédio é ocultado: aparecem apenas a estante, suas prateleiras e seus livros. A câmera não gira. O scroll (ou as teclas ↑/↓) percorre lojas; Esc ou o botão Sair da estante retorna ao prédio.

- Cada **prateleira representa uma loja ou setor**, cada **livro um computador**.
- As seis lojas permanentes **Centro, Icaraí, Itaipu, Copacabana, São Gonçalo e Ilha Plaza** têm prateleira mesmo sem computadores visíveis.
- Setores adicionais (Escritório, Administração, Extra, Sem loja e quaisquer outros) ganham prateleira somente quando têm pelo menos um computador visível. Ao ocultar o último livro, essa prateleira desaparece e as outras ocupam seu espaço.
- Existem tantas prateleiras lógicas quantas forem necessárias. A cena apresenta três de cada vez e as demais aparecem com o scroll, sem limite fixo de cinco lojas.
- Cada livro mostra seu nome e status **somente ao passar o mouse por cima**.
- O livro de agente desconectado cai em diagonal **para a direita**, apoiando-se no vizinho. Se estiver à direita sem outro livro ou for o único, inclina **para a esquerda**. Livro online ou sem sinal permanece em pé.
- Ocultar é individual e não altera a loja no servidor. A seção Itens ocultos permite restaurar todos os itens.

Status offline indica apenas ausência da conexão do agente remoto, e não necessariamente computador desligado. Em caso de perda de conexão da VPS, o estado vira desconhecido.

## Arquitetura

- backend/app.py: FastAPI local, WebSocket de leitura, segurança para LAN privada
- web/assets/world.js: escritório, câmera, isolamento completo da estante
- web/assets/bookshelf.js: geometria procedural de prateleiras e livros
- web/assets/shelf_rules.mjs: regras puras das lojas, livros, inclinação e janela de rolagem
- web/assets/main.js: UI, seleção e ocultação local
- web/index.html, web/assets/style.css: menus e sidebars
- config/projects.yaml: salas e componentes do servidor

O token da VPS permanece em config.local.json (fora do Git). O sistema não disponibiliza ações de controle remoto ou gravação. O Three.js vem incluído no repositório e não exige downloads gráficos.

Execute os testes Python com python -m unittest discover -s tests -v. Os testes de estante em Node usam node tests/shelf_rules.test.mjs. Repositório oficial: https://github.com/tecnologia-en/mapa, branch main.
