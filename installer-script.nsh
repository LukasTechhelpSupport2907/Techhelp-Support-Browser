; TechHelp Browser - NSIS Installer Script
; Copyright © 2026 TechHelp Support. All Rights Reserved.

; Administrator-Rechte erzwingen (muss außerhalb von Makros sein!)
RequestExecutionLevel admin

!macro customHeader
  !system 'echo "[NSIS] TechHelp Browser Installer - Admin Mode"'
!macroend

!macro preInit
  ; Shell-Kontext auf alle Benutzer setzen
  SetShellVarContext all
!macroend

!macro customInstall
  ; Desktop-Icon erstellen
  CreateShortcut "$DESKTOP\TechHelp Browser.lnk" "$INSTDIR\TechHelp Browser.exe" "" "$INSTDIR\TechHelp Browser.exe" 0
  
  ; Startmenü-Icon erstellen
  CreateDirectory "$SMPROGRAMS\TechHelp Support"
  CreateShortcut "$SMPROGRAMS\TechHelp Support\TechHelp Browser.lnk" "$INSTDIR\TechHelp Browser.exe" "" "$INSTDIR\TechHelp Browser.exe" 0
  CreateShortcut "$SMPROGRAMS\TechHelp Support\TechHelp Browser deinstallieren.lnk" "$INSTDIR\Uninstall TechHelp Browser.exe"
  
  ; Registry-Einträge für Browser-Erkennung
  WriteRegStr HKLM "SOFTWARE\TechHelp Support\TechHelp Browser" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "SOFTWARE\TechHelp Support\TechHelp Browser" "Version" "${VERSION}"
  WriteRegStr HKLM "SOFTWARE\TechHelp Support\TechHelp Browser" "InstallDate" "$INSTDATE"
  
  ; Als Standard-Browser registrieren (optional)
  WriteRegStr HKLM "SOFTWARE\RegisteredApplications" "TechHelp Browser" "Software\TechHelp Support\TechHelp Browser\Capabilities"
  WriteRegStr HKLM "SOFTWARE\TechHelp Support\TechHelp Browser\Capabilities" "ApplicationDescription" "TechHelp Browser - Sicherer Browser von TechHelp Support"
  WriteRegStr HKLM "SOFTWARE\TechHelp Support\TechHelp Browser\Capabilities" "ApplicationName" "TechHelp Browser"
!macroend

!macro customUnInstall
  ; Desktop-Icon löschen
  Delete "$DESKTOP\TechHelp Browser.lnk"
  
  ; Startmenü-Icons löschen
  Delete "$SMPROGRAMS\TechHelp Support\TechHelp Browser.lnk"
  Delete "$SMPROGRAMS\TechHelp Support\TechHelp Browser deinstallieren.lnk"
  RMDir "$SMPROGRAMS\TechHelp Support"
  
  ; Registry-Einträge löschen
  DeleteRegKey HKLM "SOFTWARE\TechHelp Support\TechHelp Browser"
  DeleteRegValue HKLM "SOFTWARE\RegisteredApplications" "TechHelp Browser"
!macroend
