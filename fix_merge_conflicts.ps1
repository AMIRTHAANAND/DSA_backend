# PowerShell script to resolve merge conflicts by choosing MongoDB version
$files = @(
    "src\controllers\authController.ts",
    "src\routes\admin.ts", 
    "src\routes\assignments.ts",
    "src\routes\auth.ts",
    "src\routes\progress.ts",
    "src\routes\quizzes.ts",
    "src\routes\topics.ts",
    "src\routes\users.ts",
    "src\scripts\seedDatabase.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        
        # Read the file content
        $content = Get-Content $file -Raw
        
        # Find the MongoDB section (after ======= and before >>>>>>>)
        $pattern = '(?s)=======(.*?)>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6'
        $matches = [regex]::Matches($content, $pattern)
        
        if ($matches.Count -gt 0) {
            # Replace the entire content with just the MongoDB version
            $newContent = $matches[0].Groups[1].Value.Trim()
            
            # Remove any remaining merge conflict markers
            $newContent = $newContent -replace '<<<<<<< HEAD.*?=======', ''
            $newContent = $newContent -replace '>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6', ''
            
            # Write the cleaned content back
            Set-Content $file $newContent -Encoding UTF8
            Write-Host "Fixed $file"
        } else {
            Write-Host "No merge conflicts found in $file"
        }
    }
}

Write-Host "Merge conflict resolution complete!"


