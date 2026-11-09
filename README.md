# Mapa — Enfoque Control Center 3D

Aplicativo local de visualização 3D dos projetos e equipamentos da Enfoque. O **GitHub** é a fonte oficial: alterações são publicadas neste repositório, e no desktop são aplicadas por `git pull`.

## Execução

Execute `Iniciar Mapa.bat` em um Windows com Python 3 instalado. O programa abrirá `http://127.0.0.1:8765` no navegador somente quando você clicar no `.bat`. Não possui inicialização automática.

O cliente roda totalmente local, e só faz leituras de informações autorizadas do servidor. Configurações locais e tokens nunca entram no Git.

## Desenvolvimento

Versão inicial em preparação. O ambiente gráfico usa Three.js; o servidor local utiliza apenas a biblioteca padrão do Python.
