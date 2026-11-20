Option Explicit
Dim sh, folder, nodePath, appPath
Set sh = CreateObject("WScript.Shell")
folder = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
nodePath = """" & folder & "\node.exe"""
appPath = """" & folder & "\app.js"""
sh.CurrentDirectory = folder
sh.Run nodePath & " " & appPath, 0, False
