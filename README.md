# Mapa v0.3.1 — Enfoque Control Center 3D

Mapa de projetos da Enfoque, com dois andares, móveis e personagens gerados por código, e estados reais da VPS consultados somente para leitura.

## Abrir

No Windows, abra a pasta Mapa na Área de Trabalho e execute **Iniciar Mapa.bat**. O programa prepara o Python local na primeira execução, inicia em http://127.0.0.1:47831 e abre o navegador. **Não inicia com o Windows**. Para encerrar, feche o terminal.

## Navegação

O programa abre sempre no **1º andar**, com as barras laterais esquerda e direita **recolhidas**.

- Sidebar esquerda: botões 1 e 2 para alternar andares; botão ☰ expande um menu simples com **Salas do prédio**, **Equipe**, **Páginas da intranet** e **Itens ocultos**. Cada seção é expansível; a barra inteira possui uma única rolagem personalizada.
- Teclado: ↑ sobe ao segundo andar; ↓ desce ao primeiro; 1 e 2 selecionam diretamente. Esc sai da estante ou do foco em uma equipe.
- Mouse: arrastar orbita a câmera; botão direito ou Shift + arrastar faz pan; scroll aproxima e afasta; duplo clique aproxima do elemento.
- Segundo andar: a **Intranet** ocupa uma sala inteira dividida em oito departamentos. Cada mini funcionário representa uma página HTML real da intranet, com mesa e cadeira. O catálogo está em config/intranet_pages.yaml.
- Quando o primeiro andar está ativo, o segundo permanece **semitransparente**, mostrando seu interior. Quando o segundo está ativo, o primeiro vira silhueta translúcida.
- **Estante Computadores** na sala Enfoque OS: clicar nela entra em visão frontal travada. Cada prateleira corresponde a uma loja; cada livro a um computador. Passe o mouse no livro para exibir legenda; scroll percorre as lojas sem girar a câmera. Use Esc ou Sair da estante para voltar.
- Sidebar direita: botão ◧ abre os detalhes com nome, categoria, status e ações simples. O botão Focar equipe aparece apenas para salas do primeiro andar.

## Ocultação somente visual

Salas, personagens, páginas, departamentos, computadores, lojas e estante podem ser ocultados no Mapa. A preferência fica no localStorage do navegador, chave enfoque-mapa-visual-hidden-v3. **Não existem botões de mover ou atualizar cadastros da VPS.**

Ao ocultar um funcionário ou página, somente o personagem e seu nome somem; a **mesa continua visível e clicável** para identificar quem estava ali e restaurá-lo. A seção Itens ocultos, na sidebar, também permite restaurar individualmente.

## Estados e segurança

Os estados dos seis serviços systemd e dos agentes aprovados são consultados por uma API segura e de somente leitura da VPS. O backend Python local repassa dados de apresentação por WebSocket a cada 8 segundos. Não envia comandos, reinicia serviços ou altera cadastros.

Computador online significa conexão recente do agente, não garantia de que todo o PC esteja saudável. Se a VPS ficar inacessível, os estados são desconhecidos. Nomes de usuário, IPs, tokens e identificadores físicos não são enviados ao GitHub.

O token privado fica somente em config.local.json, ignorado pelo Git. A integração já existente na VPS está documentada em server/.

## Estrutura

- backend/app.py — FastAPI local, WebSocket, estados e catálogo.
- config/projects.yaml — salas e serviços.
- config/intranet_pages.yaml — 8 departamentos e 60 páginas HTML existentes.
- web/assets/world.js — cenário, andares, escada, transparência, câmera.
- web/assets/intranet.js — departamentos, mesas e personagens do segundo andar.
- web/assets/bookshelf.js — estante e livros.
- web/assets/character.js — personagens do primeiro andar.
- web/assets/main.js — interação, seleção, ocultação no navegador.
- web/assets/style.css — visual minimalista e scroll personalizado.
- Iniciar Mapa.bat e Atualizar Mapa.bat — inicialização manual e Git pull.

O GitHub https://github.com/tecnologia-en/mapa é a fonte oficial. Alterações são publicadas em main e atualizadas no desktop com git pull --ff-only. Testes automatizados: python -m unittest discover -s tests -v.

Próximas fases: dependências, histórico SQLite e alertas; ainda não implementados.


## Acessar no mesmo Wi-Fi (rede local)

O Mapa pode ser aberto por outros aparelhos da **mesma rede doméstica** usando o navegador, sem instalar nada nesses aparelhos:

- No desktop, execute manualmente Iniciar Mapa.bat (continua sem inicialização automática).
- O terminal mostra o link de rede local: http://IP-LOCAL-DO-DESKTOP:47831
- No celular, tablet ou outro computador conectado ao mesmo roteador/Wi-Fi, use esse link. O endereço http://127.0.0.1:47831 vale apenas para o próprio desktop.
- A interface e a atualização em tempo real pelo WebSocket usam o mesmo host e porta automaticamente.
- O Firewall do Windows deve permitir **entrada TCP 47831 somente em redes privadas e a partir da sub-rede local**. No desktop original foi configurada uma regra restrita ao adaptador da rede privada; não é necessário nem recomendado abrir portas no roteador.
- Caso o roteador tenha isolamento de clientes ou Wi-Fi de convidados, a rede pode impedir que os dispositivos se enxerguem.
- O IP do desktop pode mudar ao reiniciar o roteador. Use o novo endereço mostrado pelo Mapa ao abrir.
- Para voltar ao modo somente-local no desktop: iniciar com a variável MAPA_LOCAL_ONLY=1 (ou remover a regra do Firewall).

**Importante:** todas as pessoas que participarem dessa rede privada terão acesso de visualização aos nomes das lojas, computadores e estados disponíveis no Mapa. Não existe controle ou alteração de dados na API; nenhuma credencial da VPS é fornecida. Não exponha a porta por redirecionamento/NAT ou configure o roteador para acesso público.

Se o botão de iniciar for acionado duas vezes, o script detecta que a porta 47831 já está em uso e não cria outra instância.
