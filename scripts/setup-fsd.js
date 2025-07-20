const fs = require('fs');
const path = require('path');

// Create FSD folder structure
const fsdStructure = {
    'app': ['providers', 'store', 'router'],
    'pages': ['game', 'challenge', 'profile', 'auth'],
    'widgets': ['game', 'challenge', 'user'],
    'features': ['auth', 'game', 'speech-to-text', 'question-selection', 'challenge-verification'],
    'entities': ['user', 'question', 'challenge', 'game-session', 'group', 'file', 'speech-recognition'],
    'shared': ['ui', 'lib', 'api', 'config']
};

const subFolders = ['model', 'lib', 'ui', 'api'];

function createFSDStructure() {
    const srcPath = './src';

    Object.entries(fsdStructure).forEach(([layer, segments]) => {
        segments.forEach(segment => {
            subFolders.forEach(subFolder => {
                const fullPath = path.join(srcPath, layer, segment, subFolder);
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                    console.log(`✅ Created: ${fullPath}`);
                }
            });

            // Create index.ts files
            const indexPath = path.join(srcPath, layer, segment, 'index.ts');
            if (!fs.existsSync(indexPath)) {
                fs.writeFileSync(indexPath, `// ${layer}/${segment} barrel exports\n`);
                console.log(`📄 Created: ${indexPath}`);
            }
        });
    });
}

createFSDStructure();
console.log('🎉 FSD structure created successfully!');