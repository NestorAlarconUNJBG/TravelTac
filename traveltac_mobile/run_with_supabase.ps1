param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $FlutterArgs
)

$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '..\web-app\.env'

if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
    Write-Error 'No se encontró web-app\.env. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
    exit 1
}

$settings = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
        $name = $matches[1]
        $value = $matches[2].Trim()

        if ($value.Length -ge 2) {
            $first = $value[0]
            $last = $value[$value.Length - 1]
            if (($first -eq '"' -and $last -eq '"') -or
                ($first -eq "'" -and $last -eq "'")) {
                $value = $value.Substring(1, $value.Length - 2)
            }
        }

        $settings[$name] = $value
    }
}

if (-not $settings['VITE_SUPABASE_URL'] -or
    -not $settings['VITE_SUPABASE_ANON_KEY']) {
    Write-Error 'web-app\.env debe contener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
    exit 1
}

$flutter = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutter) {
    Write-Error 'No se encontró Flutter en PATH.'
    exit 1
}

Set-Location $PSScriptRoot
& $flutter.Source run `
    "--dart-define=SUPABASE_URL=$($settings['VITE_SUPABASE_URL'])" `
    "--dart-define=SUPABASE_ANON_KEY=$($settings['VITE_SUPABASE_ANON_KEY'])" `
    @FlutterArgs
exit $LASTEXITCODE
