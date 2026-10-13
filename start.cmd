@echo off
title Shimap
cd /d "%~dp0"
echo Starting Shimap.
echo Close this window or press Ctrl+C to stop it completely.
echo Open the local URL shown below in your browser.
call npm run dev -- --host 127.0.0.1
