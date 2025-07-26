# Simple PowerShell FSD Migration Script
# Save as migrate-simple.ps1

Write-Host "Starting FSD Migration..." -ForegroundColor Green

# Create backup
$backup = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -Path "src" -Destination $backup -Recurse -Force
Write-Host "Backup created: $backup" -ForegroundColor Yellow

# Create directories
$dirs = @(
    "src/app/navigation",
    "src/pages/home/ui",
    "src/pages/challenges/ui", 
    "src/pages/groups/ui",
    "src/pages/game/www-setup/ui",
    "src/pages/game/www-play/ui",
    "src/pages/game/create-quest/ui",
    "src/pages/game/www-results/ui",
    "src/pages/auth/login/ui",
    "src/pages/auth/signup/ui",
    "src/pages/profile/ui",
    "src/pages/search/ui",
    "src/pages/user-questions/ui",
    "src/widgets/GameHeader/ui",
    "src/widgets/GameController/ui",
    "src/widgets/ChallengeFilters/ui",
    "src/features/game-session/model/hooks",
    "src/features/challenge-management/model/hooks",
    "src/entities/challenge/model",
    "src/entities/challenge/api",
    "src/entities/challenge/ui",
    "src/entities/game-session/model",
    "src/shared/types"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "Created: $dir" -ForegroundColor Gray
}

# Move files
$moves = @{
    "src/screens/HomeScreen.tsx" = "src/pages/home/ui/HomePage.tsx"
    "src/screens/ChallengeScreen.tsx" = "src/pages/challenges/ui/ChallengesPage.tsx"
    "src/screens/GroupsScreen.tsx" = "src/pages/groups/ui/GroupsPage.tsx"
    "src/screens/WWWGameSetupScreen.tsx" = "src/pages/game/www-setup/ui/WWWGameSetupPage.tsx"
    "src/screens/WWWGamePlayScreen.tsx" = "src/pages/game/www-play/ui/WWWGamePlayPage.tsx"
    "src/screens/CreateWWWQuestScreen.tsx" = "src/pages/game/create-quest/ui/CreateWWWQuestPage.tsx"
    "src/screens/WWWGameResultsScreen.tsx" = "src/pages/game/www-results/ui/WWWGameResultsPage.tsx"
    "src/screens/LoginScreen.tsx" = "src/pages/auth/login/ui/LoginPage.tsx"
    "src/screens/SignupScreen.tsx" = "src/pages/auth/signup/ui/SignupPage.tsx"
    "src/screens/ProfileScreen.tsx" = "src/pages/profile/ui/ProfilePage.tsx"
    "src/screens/SearchScreen.tsx" = "src/pages/search/ui/SearchPage.tsx"
    "src/screens/UserQuestionsScreen.tsx" = "src/pages/user-questions/ui/UserQuestionsPage.tsx"
    "src/screens/CreateUserQuestionScreen.tsx" = "src/pages/user-questions/ui/CreateUserQuestionPage.tsx"
    "src/navigation/AppNavigator.tsx" = "src/app/navigation/AppNavigator.tsx"
}

foreach ($move in $moves.GetEnumerator()) {
    if (Test-Path $move.Key) {
        Move-Item -Path $move.Key -Destination $move.Value -Force
        Write-Host "Moved: $($move.Key) -> $($move.Value)" -ForegroundColor Green
    }
}

# Move challenge entity
if (Test-Path "src/entities/ChallengeState/model/slice/challengeApi.ts") {
    Move-Item "src/entities/ChallengeState/model/slice/challengeApi.ts" "src/entities/challenge/api/challengeApi.ts" -Force
}
if (Test-Path "src/entities/ChallengeState/model/types.ts") {
    Move-Item "src/entities/ChallengeState/model/types.ts" "src/entities/challenge/model/types.ts" -Force
}
if (Test-Path "src/entities/ChallengeState/ui") {
    Copy-Item "src/entities/ChallengeState/ui/*" "src/entities/challenge/ui/" -Recurse -Force
}

Write-Host "File moving complete!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Create index files (see instructions below)" -ForegroundColor White
Write-Host "2. Update App.tsx import" -ForegroundColor White  
Write-Host "3. Fix import statements" -ForegroundColor White
Write-Host "4. Test app" -ForegroundColor White