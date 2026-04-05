# PowerShell Script to Convert All Markdown Files to PDF
# Requires: Pandoc installed (https://pandoc.org/installing.html)

Write-Host "Converting JavaScript Interview Prep Files to PDF..." -ForegroundColor Green

$files = @(
    "async-programming-deep-dive.md",
    "rxjs-reactive-programming.md",
    "event-loop-execution-model.md",
    "prototypes-inheritance-closures.md",
    "core-javascript-concepts.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $outputFile = $file -replace '\.md$', '.pdf'
        Write-Host "Converting $file to $outputFile..." -ForegroundColor Yellow
        
        pandoc $file -o $outputFile `
            --pdf-engine=xelatex `
            -V geometry:margin=1in `
            -V fontsize=11pt `
            --highlight-style=tango `
            --toc `
            --toc-depth=2
        
        if (Test-Path $outputFile) {
            Write-Host "✓ Successfully created $outputFile" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to create $outputFile" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nConversion complete! Check your folder for PDF files." -ForegroundColor Green
Write-Host "Note: If you see errors, make sure Pandoc is installed:" -ForegroundColor Cyan
Write-Host "https://pandoc.org/installing.html" -ForegroundColor Cyan
