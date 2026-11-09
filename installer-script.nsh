; TechHelp Browser Installer Script
; Automatische Installation fehlender Dependencies

; ── Administrator-Rechte prüfen ────────────────────────────
!macro customInit
  ; UAC Plugin für Admin-Rechte
  UserInfo::GetAccountType
  Pop $0
  ${If} $0 != "admin"
    MessageBox MB_ICONSTOP "Für die Installation von TechHelp Browser sind Administrator-Rechte erforderlich.$\n$\nBitte führen Sie die Installation als Administrator aus."
    SetErrorLevel 740 ; ERROR_ELEVATION_REQUIRED
    Quit
  ${EndIf}
!macroend

; ── Dependencies installieren ──────────────────────────────
!macro customInstall
  DetailPrint "Prüfe und installiere erforderliche Komponenten..."
  
  ; Visual C++ Redistributable 2015-2022 (x64)
  ${If} ${RunningX64}
    DetailPrint "Prüfe Visual C++ Redistributable..."
    ; Prüfen ob VC++ Redist installiert ist (Registry Check)
    ClearErrors
    ReadRegDword $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Version"
    ${If} ${Errors}
      DetailPrint "Visual C++ Redistributable wird installiert..."
      ; Download und Install von VC++ Redist
      NSISdl::download "https://aka.ms/vs/17/release/vc_redist.x64.exe" "$TEMP\vc_redist.x64.exe"
      Pop $0
      ${If} $0 == "success"
        DetailPrint "Installation von Visual C++ Redistributable..."
        ExecWait '"$TEMP\vc_redist.x64.exe" /install /quiet /norestart' $1
        Delete "$TEMP\vc_redist.x64.exe"
        ${If} $1 != 0
          DetailPrint "Warnung: Visual C++ Redistributable konnte nicht installiert werden (Code: $1)"
        ${Else}
          DetailPrint "Visual C++ Redistributable erfolgreich installiert"
        ${EndIf}
      ${Else}
        DetailPrint "Warnung: Visual C++ Redistributable konnte nicht heruntergeladen werden"
      ${EndIf}
    ${Else}
      DetailPrint "Visual C++ Redistributable bereits installiert"
    ${EndIf}
  ${EndIf}
  
  ; .NET Runtime prüfen (optional, falls benötigt)
  DetailPrint "Prüfe .NET Runtime..."
  ClearErrors
  ReadRegDword $0 HKLM "SOFTWARE\dotnet\Setup\InstalledVersions\x64\sharedhost" "Version"
  ${If} ${Errors}
    DetailPrint ".NET Runtime nicht gefunden - kann später nachinstalliert werden"
  ${Else}
    DetailPrint ".NET Runtime bereits installiert"
  ${EndIf}
  
  ; WebView2 Runtime prüfen (wichtig für moderne Web-Apps)
  DetailPrint "Prüfe Microsoft Edge WebView2 Runtime..."
  ClearErrors
  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${If} ${Errors}
    DetailPrint "WebView2 Runtime wird installiert..."
    NSISdl::download "https://go.microsoft.com/fwlink/p/?LinkId=2124703" "$TEMP\MicrosoftEdgeWebview2Setup.exe"
    Pop $0
    ${If} $0 == "success"
      DetailPrint "Installation von WebView2 Runtime..."
      ExecWait '"$TEMP\MicrosoftEdgeWebview2Setup.exe" /silent /install' $1
      Delete "$TEMP\MicrosoftEdgeWebview2Setup.exe"
      ${If} $1 != 0
        DetailPrint "Warnung: WebView2 Runtime konnte nicht installiert werden (Code: $1)"
      ${Else}
        DetailPrint "WebView2 Runtime erfolgreich installiert"
      ${EndIf}
    ${Else}
      DetailPrint "Warnung: WebView2 Runtime konnte nicht heruntergeladen werden"
    ${EndIf}
  ${Else}
    DetailPrint "WebView2 Runtime bereits installiert (Version: $0)"
  ${EndIf}
  
  DetailPrint "Komponentenprüfung abgeschlossen"
!macroend

; ── Nach Installation ──────────────────────────────────────
!macro customUnInstall
  DetailPrint "TechHelp Browser wird deinstalliert..."
  ; Benutzer-Einstellungen bleiben erhalten (in AppData)
!macroend

; ── Installer-Optionen ─────────────────────────────────────
!macro preInit
  ; Setze Installer-Eigenschaften
  SetShellVarContext all
  SetCompressor /SOLID lzma
  SetDatablockOptimize on
!macroend
