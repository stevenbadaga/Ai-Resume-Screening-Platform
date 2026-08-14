Write-Host "Pushing schema to remote database..."
npx prisma db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "Database push failed!"
    exit $LASTEXITCODE
}

Write-Host "Seeding database..."
npx tsx scripts/seed.ts

Write-Host "Starting background AI worker..."
Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "tsx src/lib/worker.ts"

Write-Host "Starting Next.js dev server..."
Start-Process -NoNewWindow -FilePath "npm.cmd" -ArgumentList "run dev"

Write-Host "All cloud services configured and servers started! Ready at http://localhost:3000"
