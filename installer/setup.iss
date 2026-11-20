#define MyAppName "TV YouTube Downloader"
#define MyAppVersion "1.0"
#define SrcDir "C:\Users\kia\Documents\Default Project\yt-tv-dl"
#define NodeExe "C:\Program Files\nodejs\node.exe"

[Setup]
AppId={{6F4A2B9C-8D31-4E7A-9C42-1D8E6F5A7B30}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
DefaultDirName={localappdata}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputDir={#SrcDir}\installer
OutputBaseFilename=TV_YouTube_Downloader_Setup
SetupIconFile={#SrcDir}\icon-round.ico
UninstallDisplayIcon={#SrcDir}\icon-round.ico
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
Source: "{#SrcDir}\app.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SrcDir}\launch.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SrcDir}\icon-round.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SrcDir}\public\index.html"; DestDir: "{app}\public"; Flags: ignoreversion
Source: "{#SrcDir}\bin\yt-dlp.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "{#NodeExe}"; DestDir: "{app}"; DestName: "node.exe"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\launch.vbs"""; IconFilename: "{app}\icon-round.ico"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\launch.vbs"""; IconFilename: "{app}\icon-round.ico"; WorkingDir: "{app}"

[Run]
Filename: "wscript.exe"; Parameters: """{app}\launch.vbs"""; Description: "Jalankan {#MyAppName}"; Flags: nowait postinstall skipifsilent
