# Automated hourly git push script for PowerShell
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptDir\.."

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$logFile = ".git\hourly-push.log"

$status = git status --porcelain
if ($status) {
    "[$timestamp] Changes detected, staging safe changes..." | Out-File -Append -FilePath $logFile
    git add -A
    git commit -m "feat(auto-sync): hourly hackathon progress [$timestamp]" | Out-File -Append -FilePath $logFile
    git push origin main | Out-File -Append -FilePath $logFile
    "[$timestamp] Push complete." | Out-File -Append -FilePath $logFile
} else {
    "[$timestamp] Working tree clean, nothing to commit." | Out-File -Append -FilePath $logFile
}
