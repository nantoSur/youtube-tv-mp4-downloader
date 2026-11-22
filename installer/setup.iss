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
Name: "indonesian"; MessagesFile: "Indonesian.isl"

[CustomMessages]
DownloadPageTitle=Download folder
DownloadPageDesc=Choose the folder where downloaded videos will be saved.
DownloadFolderLabel=Destination folder for downloads:
BrowseButton=Browse...
BrowseDialogTitle=Select download folder
indonesian.DownloadPageTitle=Folder unduhan
indonesian.DownloadPageDesc=Pilih folder tempat video hasil unduhan akan disimpan.
indonesian.DownloadFolderLabel=Folder tujuan penyimpanan file download:
indonesian.BrowseButton=Jelajah...
indonesian.BrowseDialogTitle=Pilih folder unduhan

[Files]
Source: "..\app.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\launch.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\icon-round.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\public\index.html"; DestDir: "{app}\public"; Flags: ignoreversion
Source: "..\public\favicon.ico"; DestDir: "{app}\public"; Flags: ignoreversion
Source: "..\bin\yt-dlp.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "{#NodeExe}"; DestDir: "{app}"; DestName: "node.exe"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\launch.vbs"""; IconFilename: "{app}\icon-round.ico"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "wscript.exe"; Parameters: """{app}\launch.vbs"""; IconFilename: "{app}\icon-round.ico"; WorkingDir: "{app}"

[Run]
Filename: "wscript.exe"; Parameters: """{app}\launch.vbs"""; Description: "Jalankan {#MyAppName}"; Flags: nowait postinstall skipifsilent

[Code]
var
  DownloadDirPage: TWizardPage;
  DownloadDirLabel: TLabel;
  DownloadDirEdit: TEdit;
  DownloadDirBrowse: TButton;

function SavedDownloadDir(const AppDir: string): string;
var
  ConfigFile: string;
  Lines: TStringList;
begin
  Result := '';
  ConfigFile := AppDir + '\download-folder.txt';
  if FileExists(ConfigFile) then
  begin
    Lines := TStringList.Create;
    try
      Lines.LoadFromFile(ConfigFile);
      if Lines.Count > 0 then Result := Trim(Lines.Strings[0]);
    finally
      Lines.Free;
    end;
  end;
  if Result = '' then Result := ExpandConstant('{userdocs}\TV YouTube Downloader');
end;

function PickDownloadDir: string;
var
  Shell, Folder: Variant;
begin
  Result := '';
  try
    Shell := CreateOleObject('Shell.Application');
    Folder := Shell.BrowseForFolder(WizardForm.Handle, CustomMessage('BrowseDialogTitle'), 1, '');
    if not VarIsClear(Folder) then Result := Folder.Self.Path;
  except
    Result := '';
  end;
end;

procedure BrowseDownloadDirClick(Sender: TObject);
var
  Picked: string;
begin
  Picked := PickDownloadDir;
  if Picked <> '' then DownloadDirEdit.Text := Picked;
end;

procedure InitializeWizard;
begin
  DownloadDirPage := CreateCustomPage(wpSelectDir,
    CustomMessage('DownloadPageTitle'), CustomMessage('DownloadPageDesc'));

  DownloadDirLabel := TLabel.Create(DownloadDirPage);
  DownloadDirLabel.Parent := DownloadDirPage.Surface;
  DownloadDirLabel.Left := 0;
  DownloadDirLabel.Top := 12;
  DownloadDirLabel.Caption := CustomMessage('DownloadFolderLabel');

  DownloadDirEdit := TEdit.Create(DownloadDirPage);
  DownloadDirEdit.Parent := DownloadDirPage.Surface;
  DownloadDirEdit.Left := 0;
  DownloadDirEdit.Top := 36;
  DownloadDirEdit.Width := DownloadDirPage.SurfaceWidth - 100;
  DownloadDirEdit.Text := SavedDownloadDir(WizardForm.DirEdit.Text);

  DownloadDirBrowse := TButton.Create(DownloadDirPage);
  DownloadDirBrowse.Parent := DownloadDirPage.Surface;
  DownloadDirBrowse.Left := DownloadDirEdit.Left + DownloadDirEdit.Width + 8;
  DownloadDirBrowse.Top := 33;
  DownloadDirBrowse.Width := 88;
  DownloadDirBrowse.Caption := CustomMessage('BrowseButton');
  DownloadDirBrowse.OnClick := @BrowseDownloadDirClick;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = wpSelectDir then
    DownloadDirEdit.Text := SavedDownloadDir(WizardForm.DirEdit.Text);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  Dir: string;
begin
  if CurStep = ssPostInstall then
  begin
    Dir := Trim(ExpandConstant(DownloadDirEdit.Text));
    if Dir = '' then Dir := ExpandConstant('{userdocs}\TV YouTube Downloader');
    SaveStringToFile(ExpandConstant('{app}\download-folder.txt'), Dir, False);
  end;
end;
