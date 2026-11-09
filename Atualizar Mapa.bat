@echo off
setlocal
cd /d "%~dp0"
title Atualizar Mapa pelo GitHub
echo Atualizando o Mapa pela branch principal...
git pull --ff-only
if errorlevel 1 (
    echo Falha na atualizacao: alteracoes locais foram preservadas.
) else (
    echo Atualizacao concluida. Abra "Iniciar Mapa.bat".
)
pause
