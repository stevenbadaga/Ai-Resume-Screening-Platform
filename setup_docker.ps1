$maxRetries = 120 # 120 * 10s = 20 minutes
$retryCount = 0
$dockerReady = $false

Write-Host "Starting to poll for Docker installation and startup..."

while (-not $dockerReady -and $retryCount -lt $maxRetries) {
    # Refresh PATH dynamically so we pick up the new Docker installation without needing to restart the terminal
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    try {
        # Check if the docker command exists and if the daemon responds
        $dockerOutput = docker info 2>&1
        if ($LASTEXITCODE -eq 0 -and $dockerOutput -match "Server Version") {
            $dockerReady = $true
            Write-Host "Docker is installed and the daemon is running!"
        } else {
            Write-Host "Waiting for Docker daemon to start... ($retryCount/$maxRetries)"
            Start-Sleep -Seconds 10
        }
    } catch {
        Write-Host "Docker command not found yet. Retrying... ($retryCount/$maxRetries)"
        Start-Sleep -Seconds 10
    }
    $retryCount++
}

if ($dockerReady) {
    Write-Host "Starting Docker Compose..."
    docker compose up -d
    
    Write-Host "Waiting a moment for PostgreSQL to fully initialize..."
    Start-Sleep -Seconds 10
    
    Write-Host "Pushing Prisma database schema..."
    npx prisma db push
    
    if (Test-Path "scripts/seed.ts") {
        Write-Host "Seeding database..."
        npx tsx scripts/seed.ts
    }
    
    Write-Host "All setup tasks completed successfully!"
} else {
    Write-Host "Timed out waiting for Docker. Please make sure Docker Desktop is installed and running."
    exit 1
}
