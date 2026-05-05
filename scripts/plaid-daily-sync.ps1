# plaid-daily-sync.ps1
# Triggers the plaid-sync-transactions Edge Function for all users.
# Schedule this via Windows Task Scheduler to run daily.
#
# Setup (run once as Administrator):
#   $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NonInteractive -File `"C:\Users\mctel\source\repos\budge-it\scripts\plaid-daily-sync.ps1`""
#   $trigger = New-ScheduledTaskTrigger -Daily -At 6:00AM
#   Register-ScheduledTask -TaskName "Budge-It Plaid Sync" -Action $action -Trigger $trigger -RunLevel Highest

$envFile = Join-Path $PSScriptRoot "..\.env.local"
$env = Get-Content $envFile | Where-Object { $_ -match "=" } | ForEach-Object {
  $parts = $_ -split "=", 2
  [PSCustomObject]@{ Key = $parts[0].Trim(); Value = $parts[1].Trim() }
}

$cronSecret  = ($env | Where-Object Key -eq "CRON_SECRET").Value
$supabaseUrl = ($env | Where-Object Key -eq "VITE_SUPABASE_URL").Value

if (-not $cronSecret -or -not $supabaseUrl) {
  Write-Error "Missing CRON_SECRET or VITE_SUPABASE_URL in .env.local"
  exit 1
}

$url  = "$supabaseUrl/functions/v1/plaid-sync-transactions"
$body = '{}'

try {
  $response = Invoke-RestMethod `
    -Uri $url `
    -Method POST `
    -Headers @{
      "Content-Type"  = "application/json"
      "x-cron-secret" = $cronSecret
    } `
    -Body $body

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $summary = $response.results | ForEach-Object { "$($_.item_id): +$($_.added) mod:$($_.modified) rm:$($_.removed)" }
  Write-Host "[$timestamp] Plaid sync OK: $($summary -join ', ')"
} catch {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Error "[$timestamp] Plaid sync FAILED: $_"
  exit 1
}
