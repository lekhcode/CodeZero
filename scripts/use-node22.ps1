# Prefer system Node 22 over older / bundled Node on PATH (fixes Prisma ERR_REQUIRE_ESM).
$nodeDir = "C:\Program Files\nodejs"
if (Test-Path "$nodeDir\node.exe") {
  $env:Path = "$nodeDir;" + ($env:Path -split ';' | Where-Object { $_ -notmatch 'nodejs' -or $_ -eq $nodeDir } | Select-Object -Unique) -join ';'
  Write-Host "Using Node: $(& "$nodeDir\node.exe" -v)"
} else {
  Write-Warning "Node 22 not found at $nodeDir — install from https://nodejs.org"
}
