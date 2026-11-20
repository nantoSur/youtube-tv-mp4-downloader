#define MyAppName "TV YouTube Downloader"
#define MyAppVersion "1.0"

; Path relatif terhadap folder tempat setup.iss berada, supaya portable.
; NodeExe bisa dioverride saat kompilasi: ISCC.exe /dNodeExe="D:\path\node.exe"
#ifndef NodeExe
  #if FileExists(GetEnv("ProgramFiles") + "\nodejs\node.exe")
    #define NodeExe GetEnv("ProgramFiles") + "\nodejs\node.exe"
  #elif FileExists(GetEnv("ProgramW6432") + "\nodejs\node.exe")
    #define NodeExe GetEnv("ProgramW6432") + "\nodejs\node.exe"
  #else
    #error node.exe tidak ditemukan. Kompilasi dengan: ISCC.exe /dNodeExe="C:\path\node.exe"
  #endif
#endif

[Setup]
AppId={{6F4A2B9C-8D31-4E7A-9C42-1D8E6F5A7B30}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
DefaultDirName={localappdata}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputDir=.
OutputBaseFilename=TV_YouTube_Downloader_Setup
SetupIconFile=..\icon-round.ico
UninstallDisplayIcon={app}\icon-round.ico
UninstallDisplayName={#MyAppName}
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
DisableProgramGroupPage=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\app.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\launch.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\icon-round.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\public\index.html"; DestDir: "{app}\public"; Flags: ignoreversion
Source: "..\bin\yt-dlp.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "{#NodeExe}"; DestDir: "{app}"; DestName: "node.exe"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\launch.vbs"""; IconFilename: "{app}\icon-round.ico"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\launch.vbs"""; IconFilename: "{app}\icon-round.ico"; WorkingDir: "{app}"

[Run]
Filename: "wscript.exe"; Parameters: """{app}\launch.vbs"""; Description: "Jalankan {#MyAppName}"; Flags: nowait postinstall skipifsilent
