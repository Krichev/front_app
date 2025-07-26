# Post-Migration FSD Completion Script
# Run this after the main migration script

Write-Host "🔧 Completing FSD Migration - Step 2..." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

# Function to create all missing index files
function New-IndexFiles {
    Write-Host "📄 Creating all index files..." -ForegroundColor Yellow

    # Main pages index file
    $pagesIndex = @'
// Pages exports
export { HomePage } from './home';
export { ChallengesPage } from './challenges';
export { GroupsPage } from './groups';
export { ProfilePage } from './profile';
export { SearchPage } from './search';

// Game pages
export { WWWGameSetupPage } from './game/www-setup';
export { WWWGamePlayPage } from './game/www-play';
export { WWWGameResultsPage } from './game/www-results';
export { CreateWWWQuestPage } from './game/create-quest';

// Auth pages
export { LoginPage } from './auth/login';
export { SignupPage } from './auth/signup';

// User pages
export { UserQuestionsPage } from './user-questions';
'@

    Set-Content -Path "src/pages/index.ts" -Value $pagesIndex -Encoding UTF8
    Write-Host "  ✅ Created src/pages/index.ts"

    # Individual page index files
    $pageIndexes = @{
        "src/pages/home/index.ts" = "export { HomePage } from './ui/HomePage';"
        "src/pages/challenges/index.ts" = "export { ChallengesPage } from './ui/ChallengesPage';"
        "src/pages/groups/index.ts" = "export { GroupsPage } from './ui/GroupsPage';"
        "src/pages/profile/index.ts" = "export { ProfilePage } from './ui/ProfilePage';"
        "src/pages/search/index.ts" = "export { SearchPage } from './ui/SearchPage';"
        "src/pages/game/www-setup/index.ts" = "export { WWWGameSetupPage } from './ui/WWWGameSetupPage';"
        "src/pages/game/www-play/index.ts" = "export { WWWGamePlayPage } from './ui/WWWGamePlayPage';"
        "src/pages/game/www-results/index.ts" = "export { WWWGameResultsPage } from './ui/WWWGameResultsPage';"
        "src/pages/game/create-quest/index.ts" = "export { CreateWWWQuestPage } from './ui/CreateWWWQuestPage';"
        "src/pages/auth/login/index.ts" = "export { LoginPage } from './ui/LoginPage';"
        "src/pages/auth/signup/index.ts" = "export { SignupPage } from './ui/SignupPage';"
        "src/pages/user-questions/index.ts" = @'
export { UserQuestionsPage } from './ui/UserQuestionsPage';
export { CreateUserQuestionPage } from './ui/CreateUserQuestionPage';
'@
    }

    foreach ($index in $pageIndexes.GetEnumerator()) {
        $dir = Split-Path -Parent $index.Key
        if (!(Test-Path $dir)) {
            New-Item -Path $dir -ItemType Directory -Force | Out-Null
        }
        Set-Content -Path $index.Key -Value $index.Value -Encoding UTF8
        Write-Host "  ✅ Created $($index.Key)"
    }

    # Widgets index
    $widgetsIndex = @'
// Game widgets
export { GameHeaderWidget } from './GameHeader';
export { GameControllerWidget } from './GameController';
export { GameResultsWidget } from './GameResults';
export { GameSessionWidget } from './GameSession';

// Challenge widgets
export { ChallengeFiltersWidget } from './ChallengeFilters';
export { ChallengeListWidget } from './ChallengeList';

// Home widgets
export { WelcomeWidget } from './Welcome';
export { RecentChallengesWidget } from './RecentChallenges';
export { QuickActionsWidget } from './QuickActions';
'@

    Set-Content -Path "src/widgets/index.ts" -Value $widgetsIndex -Encoding UTF8
    Write-Host "  ✅ Created src/widgets/index.ts"

    # Features index
    $featuresIndex = @'
// Auth feature
export { authSlice, authActions, authSelectors } from './auth';

// Game session feature
export { useGameSession } from './game-session/model/hooks/useGameSession';
export { GameAnswerForm } from './game-session/ui/GameAnswerForm';
export { GameDiscussionPanel } from './game-session/ui/GameDiscussionPanel';

// Challenge management feature
export { useChallengeFilters } from './challenge-management/model/hooks/useChallengeFilters';
export { CreateChallengeFAB } from './challenge-management/ui/CreateChallengeFAB';

// Speech features
export { useSpeechToText } from './speech-to-text';
export { useWWWDiscussion } from './www-game-discussion';
export { useChallengeVerification } from './challenge-verification';
'@

    Set-Content -Path "src/features/index.ts" -Value $featuresIndex -Encoding UTF8
    Write-Host "  ✅ Created src/features/index.ts"

    # Entities index
    $entitiesIndex = @'
// User entity
export { userApi } from './user/api/userApi';
export type { User, UserProfile } from './user/model/types';

// Challenge entity
export { challengeApi } from './challenge/api/challengeApi';
export { challengeSlice, challengeActions, challengeSelectors } from './challenge/model/slice';
export type { Challenge, ChallengeType, ChallengeStatus } from './challenge/model/types';

// Game session entity
export { gameSessionSlice, gameSessionActions, gameSessionSelectors } from './game-session/model/slice';
export type { GameSession, GamePhase, GameSettings } from './game-session/model/types';

// Question entity
export { questionApi } from './question/api/questionApi';
export { questionSlice, questionActions, questionSelectors } from './question/model/slice';
export type { GameQuestion } from './question/model/types';

// Verification entity
export { verificationSlice, verificationActions, verificationSelectors } from './verification/model/slice';
export type { VerificationRecord, VerificationMethod } from './verification/model/types';
'@

    Set-Content -Path "src/entities/index.ts" -Value $entitiesIndex -Encoding UTF8
    Write-Host "  ✅ Created src/entities/index.ts"

    # Challenge entity index
    $challengeIndex = @'
export { challengeApi, useGetChallengesQuery, useCreateChallengeMutation } from './api/challengeApi';
export { challengeSlice, challengeActions, challengeSelectors } from './model/slice';
export type { Challenge, ChallengeType, ChallengeStatus, WWWQuizConfig } from './model/types';
export { QuizChallengeCard } from './ui/QuizChallengeCard';
'@

    # Create challenge entity directory if it doesn't exist
    if (!(Test-Path "src/entities/challenge")) {
        New-Item -Path "src/entities/challenge" -ItemType Directory -Force | Out-Null
    }

    Set-Content -Path "src/entities/challenge/index.ts" -Value $challengeIndex -Encoding UTF8
    Write-Host "  ✅ Created src/entities/challenge/index.ts"

    # Shared types index
    $sharedTypesIndex = @'
// Navigation types
export type {
    RootStackParamList,
    MainTabParamList,
    HomeNavigationProp,
    ChallengesNavigationProp,
    WWWGamePlayNavigationProp,
    WWWGamePlayRouteProp
} from './navigation';

// Common types
export type { ApiResponse, PaginatedResponse } from './api';
export type { BaseEntity, EntityStatus } from './common';
'@

    # Create shared/types directory if it doesn't exist
    if (!(Test-Path "src/shared/types")) {
        New-Item -Path "src/shared/types" -ItemType Directory -Force | Out-Null
    }

    Set-Content -Path "src/shared/types/index.ts" -Value $sharedTypesIndex -Encoding UTF8
    Write-Host "  ✅ Created src/shared/types/index.ts"
}

# Function to update AppNavigator
function New-AppNavigator {
    Write-Host "🎨 Creating updated AppNavigator..." -ForegroundColor Yellow

    $appNavigatorContent = @'
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../providers/StoreProvider/store';

// Pages imports
import {
    HomePage,
    ChallengesPage,
    GroupsPage,
    ProfilePage,
    SearchPage,
    WWWGameSetupPage,
    WWWGamePlayPage,
    WWWGameResultsPage,
    CreateWWWQuestPage,
    LoginPage,
    SignupPage,
    UserQuestionsPage,
    CreateUserQuestionPage
} from '../../pages';

// Navigation types
import { RootStackParamList, MainTabParamList } from '../../shared/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => (
    <Tab.Navigator>
        <Tab.Screen
            name="Home"
            component={HomePage}
            options={{ title: 'Home' }}
        />
        <Tab.Screen
            name="Challenges"
            component={ChallengesPage}
            options={{ title: 'Challenges' }}
        />
        <Tab.Screen
            name="Search"
            component={SearchPage}
            options={{ title: 'Search' }}
        />
        <Tab.Screen
            name="Groups"
            component={GroupsPage}
            options={{ title: 'Groups' }}
        />
        <Tab.Screen
            name="Profile"
            component={ProfilePage}
            options={{ title: 'Profile' }}
        />
    </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
    const isAuthenticated = useSelector((state: RootState) => state.auth?.isAuthenticated);

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {isAuthenticated ? (
                    <>
                        <Stack.Screen
                            name="Main"
                            component={MainTabNavigator}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="WWWGameSetup"
                            component={WWWGameSetupPage}
                            options={{ title: 'Game Setup' }}
                        />
                        <Stack.Screen
                            name="WWWGamePlay"
                            component={WWWGamePlayPage}
                            options={{ title: 'What? Where? When?', headerShown: false }}
                        />
                        <Stack.Screen
                            name="WWWGameResults"
                            component={WWWGameResultsPage}
                            options={{ title: 'Game Results' }}
                        />
                        <Stack.Screen
                            name="CreateWWWQuest"
                            component={CreateWWWQuestPage}
                            options={{ title: 'Create Quest' }}
                        />
                        <Stack.Screen
                            name="UserQuestions"
                            component={UserQuestionsPage}
                            options={{ title: 'My Questions' }}
                        />
                        <Stack.Screen
                            name="CreateUserQuestion"
                            component={CreateUserQuestionPage}
                            options={{ title: 'Create Question' }}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginPage}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Signup"
                            component={SignupPage}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
'@

    # Create navigation directory if it doesn't exist
    if (!(Test-Path "src/app/navigation")) {
        New-Item -Path "src/app/navigation" -ItemType Directory -Force | Out-Null
    }

    Set-Content -Path "src/app/navigation/AppNavigator.tsx" -Value $appNavigatorContent -Encoding UTF8
    Write-Host "  ✅ Updated AppNavigator with proper imports"
}

# Function to fix import statements throughout the codebase
function Update-ImportStatements {
    Write-Host "🔄 Fixing import statements throughout codebase..." -ForegroundColor Yellow

    # Get all TypeScript/JavaScript files
    $files = Get-ChildItem -Path "src" -Include "*.ts", "*.tsx", "*.js", "*.jsx" -Recurse -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notlike "*node_modules*" -and
        $_.FullName -notlike "*backup_*"
    }

    if ($files.Count -eq 0) {
        Write-Host "  ⚠️  No source files found to update" -ForegroundColor Yellow
        return
    }

    $totalFiles = $files.Count
    $processedFiles = 0
    $changedFiles = 0

    foreach ($file in $files) {
        $processedFiles++
        Write-Progress -Activity "Updating import statements" -Status "Processing $($file.Name)" -PercentComplete (($processedFiles / $totalFiles) * 100)

        try {
            $content = Get-Content $file.FullName -Raw -Encoding UTF8
            $originalContent = $content

            # Replace component names first
            $content = $content -replace '\bHomeScreen\b', 'HomePage'
            $content = $content -replace '\bChallengeScreen\b', 'ChallengesPage'
            $content = $content -replace '\bChallengesScreen\b', 'ChallengesPage'
            $content = $content -replace '\bGroupsScreen\b', 'GroupsPage'
            $content = $content -replace '\bWWWGameSetupScreen\b', 'WWWGameSetupPage'
            $content = $content -replace '\bWWWGamePlayScreen\b', 'WWWGamePlayPage'
            $content = $content -replace '\bCreateWWWQuestScreen\b', 'CreateWWWQuestPage'
            $content = $content -replace '\bWWWGameResultsScreen\b', 'WWWGameResultsPage'
            $content = $content -replace '\bLoginScreen\b', 'LoginPage'
            $content = $content -replace '\bSignupScreen\b', 'SignupPage'
            $content = $content -replace '\bProfileScreen\b', 'ProfilePage'
            $content = $content -replace '\bSearchScreen\b', 'SearchPage'
            $content = $content -replace '\bUserQuestionsScreen\b', 'UserQuestionsPage'
            $content = $content -replace '\bCreateUserQuestionScreen\b', 'CreateUserQuestionPage'

            # Fix import paths - screens to pages
            $content = $content -replace "from\s+['""]\.\.\/screens\/", "from '../pages/"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/screens\/", "from '../../pages/"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/\.\.\/screens\/", "from '../../../pages/"

            # Fix navigation imports
            $content = $content -replace "from\s+['""]\.\.\/navigation\/AppNavigator['""]", "from '../app/navigation/AppNavigator'"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/navigation\/AppNavigator['""]", "from '../../app/navigation/AppNavigator'"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/\.\.\/navigation\/AppNavigator['""]", "from '../../../app/navigation/AppNavigator'"

            # Fix entity imports - ChallengeState to challenge
            $content = $content -replace "from\s+['""]\.\.\/entities\/ChallengeState\/", "from '../entities/challenge/"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/entities\/ChallengeState\/", "from '../../entities/challenge/"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/\.\.\/entities\/ChallengeState\/", "from '../../../entities/challenge/"

            # Fix store imports
            $content = $content -replace "from\s+['""]\.\.\/app\/providers\/StoreProvider\/store['""]", "from '../app/providers/StoreProvider/store'"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/app\/providers\/StoreProvider\/store['""]", "from '../../app/providers/StoreProvider/store'"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/\.\.\/app\/providers\/StoreProvider\/store['""]", "from '../../../app/providers/StoreProvider/store'"

            # Update shared UI imports to use barrel exports
            $content = $content -replace "from\s+['""]\.\.\/shared\/ui\/[^'""\/]+\/[^'""\/]+['""]", "from '../shared/ui'"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/shared\/ui\/[^'""\/]+\/[^'""\/]+['""]", "from '../../shared/ui'"
            $content = $content -replace "from\s+['""]\.\.\/\.\.\/\.\.\/shared\/ui\/[^'""\/]+\/[^'""\/]+['""]", "from '../../../shared/ui'"

            # Only write if content changed
            if ($content -ne $originalContent) {
                Set-Content -Path $file.FullName -Value $content -Encoding UTF8
                $changedFiles++
                Write-Host "  ✅ Updated: $($file.Name)" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  ⚠️  Error updating $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Progress -Activity "Updating import statements" -Completed
    Write-Host "  ✅ Processed $totalFiles files, updated $changedFiles files" -ForegroundColor Green
}

# Function to create sample widget components
function New-SampleWidgets {
    Write-Host "🎨 Creating sample widget components..." -ForegroundColor Yellow

    # Create GameHeader directory structure
    if (!(Test-Path "src/widgets/GameHeader/ui")) {
        New-Item -Path "src/widgets/GameHeader/ui" -ItemType Directory -Force | Out-Null
    }

    # Create GameHeaderWidget
    $gameHeaderWidget = @'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GameHeaderWidgetProps {
    gameSession: any;
    progress?: number;
}

export const GameHeaderWidget: React.FC<GameHeaderWidgetProps> = ({
    gameSession,
    progress = 0
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Game Header</Text>
            <Text style={styles.progress}>Progress: {Math.round(progress)}%</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 16,
        elevation: 4,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    progress: {
        fontSize: 14,
        color: '#666',
    },
});
'@

    Set-Content -Path "src/widgets/GameHeader/ui/GameHeaderWidget.tsx" -Value $gameHeaderWidget -Encoding UTF8
    "export { GameHeaderWidget } from './ui/GameHeaderWidget';" | Set-Content "src/widgets/GameHeader/index.ts" -Encoding UTF8

    # Create ChallengeFilters directory structure
    if (!(Test-Path "src/widgets/ChallengeFilters/ui")) {
        New-Item -Path "src/widgets/ChallengeFilters/ui" -ItemType Directory -Force | Out-Null
    }

    # Create ChallengeFiltersWidget
    $challengeFiltersWidget = @'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChallengeFiltersWidgetProps {
    selectedType?: string;
    onTypeChange?: (type: string) => void;
}

export const ChallengeFiltersWidget: React.FC<ChallengeFiltersWidgetProps> = ({
    selectedType,
    onTypeChange
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Challenge Filters</Text>
            <Text style={styles.subtitle}>Selected: {selectedType || 'All'}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
});
'@

    Set-Content -Path "src/widgets/ChallengeFilters/ui/ChallengeFiltersWidget.tsx" -Value $challengeFiltersWidget -Encoding UTF8
    "export { ChallengeFiltersWidget } from './ui/ChallengeFiltersWidget';" | Set-Content "src/widgets/ChallengeFilters/index.ts" -Encoding UTF8

    Write-Host "  ✅ Created sample widgets"
}

# Function to validate the migration
function Test-Migration {
    Write-Host "🔍 Validating FSD structure..." -ForegroundColor Yellow

    $errors = @()
    $warnings = @()

    # Check directory structure
    $requiredDirs = @(
        "src/app", "src/pages", "src/widgets", "src/features", "src/entities", "src/shared"
    )

    foreach ($dir in $requiredDirs) {
        if (!(Test-Path $dir)) {
            $errors += "Missing directory: $dir"
        }
    }

    # Check essential files
    $essentialFiles = @(
        "src/pages/index.ts",
        "src/app/navigation/AppNavigator.tsx",
        "src/shared/types/navigation.ts"
    )

    foreach ($file in $essentialFiles) {
        if (!(Test-Path $file)) {
            $errors += "Missing essential file: $file"
        }
    }

    # Check if pages exist
    $pageFiles = Get-ChildItem -Path "src/pages" -Include "*Page.tsx" -Recurse -ErrorAction SilentlyContinue
    if ($pageFiles) {
        Write-Host "  ✅ Found $($pageFiles.Count) page components"
    }

    # Check for old screen references
    $screenRefs = Get-ChildItem -Path "src" -Include "*.ts", "*.tsx" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match '\bScreen\b' -and $content -notmatch 'Screen\s*=' -and $content -notmatch 'createNativeStackNavigator') {
            $_.Name
        }
    }

    if ($screenRefs -and $screenRefs.Count -gt 0) {
        $warnings += "Files may still contain Screen references: $($screenRefs -join ', ')"
    }

    # Display results
    if ($errors.Count -eq 0) {
        Write-Host "  ✅ Migration structure validation passed!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Validation errors:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "    - $error" -ForegroundColor Red
        }
    }

    if ($warnings.Count -gt 0) {
        Write-Host "  ⚠️  Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "    - $warning" -ForegroundColor Yellow
        }
    }

    return $errors.Count -eq 0
}

# Main execution
try {
    # Ensure src directory exists
    if (!(Test-Path "src")) {
        Write-Error "src directory not found. Are you in the correct project directory?"
        exit 1
    }

    New-IndexFiles
    New-AppNavigator
    Update-ImportStatements
    New-SampleWidgets

    $isValid = Test-Migration

    Write-Host ""
    Write-Host "🎉 FSD Migration Step 2 Complete!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 FINAL STEPS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Update your main App.tsx file:" -ForegroundColor White
    Write-Host "   OLD: import AppNavigator from './src/navigation/AppNavigator';" -ForegroundColor Gray
    Write-Host "   NEW: import { AppNavigator } from './src/app/navigation/AppNavigator';" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. Clear cache and restart:" -ForegroundColor White
    Write-Host "   npx react-native start --reset-cache" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Run your app:" -ForegroundColor White
    Write-Host "   npx react-native run-android" -ForegroundColor Cyan
    Write-Host "   # or npx react-native run-ios" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Fix any remaining TypeScript errors in your IDE" -ForegroundColor White
    Write-Host ""
    Write-Host "📁 Your new FSD structure:" -ForegroundColor Cyan
    Write-Host "├── src/app/           # Application layer" -ForegroundColor Gray
    Write-Host "├── src/pages/         # Pages (former screens)" -ForegroundColor Gray
    Write-Host "├── src/widgets/       # Complex UI components" -ForegroundColor Gray
    Write-Host "├── src/features/      # Business logic" -ForegroundColor Gray
    Write-Host "├── src/entities/      # Data entities" -ForegroundColor Gray
    Write-Host "└── src/shared/        # Shared utilities" -ForegroundColor Gray
    Write-Host ""

    if ($isValid) {
        Write-Host "✅ All checks passed! Your FSD migration is complete!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Please address the validation errors above" -ForegroundColor Yellow
    }
}
catch {
    Write-Error "❌ Step 2 failed: $($_.Exception.Message)"
    Write-Host "💡 You may need to fix some issues manually" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🏁 Post-migration script finished!" -ForegroundColor Green