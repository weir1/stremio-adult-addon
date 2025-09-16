# git-quick.ps1
# A simple script to add, commit, and push changes with a custom commit message

# Stage all changes
git add .

# Ask for commit message
$commitMessage = Read-Host "Enter commit message"

# Commit with message
git commit -m "$commitMessage"

# Push to current branch
git push origin main
