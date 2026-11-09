@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if errorlevel 1 goto falha

title Enfoque Mapa 3D - Iniciador
echo.
echo ============================================
echo          ENFOQUE CONTROL CENTER 3D
echo ============================================
echo.
echo Pasta: %CD%
echo.

rem Priorizar o interpretador ja instalado no projeto.
set "APP_PY=%CD%\.venv\Scripts\python.exe"
if exist "%APP_PY%" goto verificar

echo Primeira execucao: preparando Python local...
set "BOOTSTRAP_PY="

where py >nul 2>&1
if not errorlevel 1 (
    py -3 --version >nul 2>&1
    if not errorlevel 1 set "BOOTSTRAP_PY=py -3"
)

if not defined BOOTSTRAP_PY (
    where python >nul 2>&1
    if not errorlevel 1 (
        python --version >nul 2>&1
        if not errorlevel 1 set "BOOTSTRAP_PY=python"
    )
)

rem Contingencia para instalacao padrao de Python no Windows.
if not defined BOOTSTRAP_PY (
    for %%V in (314 313 312 311 310) do (
        if exist "%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe" (
            set "BOOTSTRAP_PY=%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe"
            goto criar_venv
        )
    )
)
if not defined BOOTSTRAP_PY goto sem_python

:criar_venv
echo Criando ambiente virtual do Mapa...
%BOOTSTRAP_PY% -m venv .venv
if errorlevel 1 goto falha
if not exist "%APP_PY%" goto falha

:verificar
echo Verificando bibliotecas do Mapa...
"%APP_PY%" -c "import fastapi, uvicorn, yaml, websockets" >nul 2>&1
if errorlevel 1 (
    echo Instalando bibliotecas Python no ambiente local...
    "%APP_PY%" -m pip install --disable-pip-version-check -r requirements.txt
    if errorlevel 1 goto falha
)

if not exist "web\assets\three.module.js" (
    echo Preparando motor 3D na pasta do Mapa...
    "%APP_PY%" scripts\bootstrap.py
    if errorlevel 1 goto falha
)

echo.
echo Iniciando Mapa em http://127.0.0.1:47831
echo O navegador sera aberto apos o servidor estar pronto.
echo Para encerrar, pressione Ctrl+C ou feche esta janela.
echo.
"%APP_PY%" -m backend.app
set "APP_EXIT=%errorlevel%"
echo.
if not "%APP_EXIT%"=="0" (
    echo O Mapa terminou com erro: %APP_EXIT%.
    echo Copie esta mensagem se precisar de ajuda.
) else (
    echo O Mapa foi encerrado.
)
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
exit /b %APP_EXIT%

:sem_python
echo.
echo ERRO: Python nao localizado e o ambiente virtual nao existe.
echo Instale Python 3 ou verifique a pasta .venv do Mapa.
goto falha

:falha
echo.
echo Falha ao iniciar o Mapa. Nenhum programa de terceiros foi alterado.
echo Esta janela permanecera aberta para diagnostico.
echo Pressione qualquer tecla para fechar...
pause >nul
exit /b 1
