@echo off
setlocal
cd /d "%~dp0"
title Mapa - Control Center 3D
echo.
echo     ENFOQUE CONTROL CENTER 3D
echo     -------------------------
echo.
where py >nul 2>&1
if %errorlevel% EQU 0 (
    set "PY=py -3"
) else (
    set "PY=python"
)
%PY% --version >nul 2>&1
if errorlevel 1 (
    echo Python nao encontrado. Nao foi possivel iniciar.
    pause
    exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
    echo Preparando ambiente Python local (somente na primeira vez)...
    %PY% -m venv .venv
    if errorlevel 1 goto error
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt --disable-pip-version-check
    if errorlevel 1 goto error
)
if not exist "web\assets\three.module.js" (
    echo Instalando o motor grafico Three.js na pasta do projeto...
    ".venv\Scripts\python.exe" scripts\bootstrap.py
    if errorlevel 1 goto error
)
echo.
echo Abrindo o ambiente local. Use o botao INICIAR para entrar no 3D.
".venv\Scripts\python.exe" -m backend.app
echo.
echo Mapa encerrado.
pause
exit /b 0
:error
echo.
echo Falha ao preparar o Mapa. Nenhuma configuracao do Windows foi alterada.
pause
exit /b 1
