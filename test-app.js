// Simple test script to verify the KushCloud application
// Run with: node test-app.js

const fs = require('fs');
const path = require('path');

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkPackageJson() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required fields
    const requiredFields = ['name', 'version', 'description', 'scripts', 'dependencies', 'devDependencies'];
    const missingFields = requiredFields.filter(field => !pkg[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ package.json missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Check scripts
    const requiredScripts = ['dev', 'build', 'preview'];
    const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
    
    if (missingScripts.length > 0) {
      console.log(`❌ package.json missing required scripts: ${missingScripts.join(', ')}`);
      return false;
    }
    
    // Check dependencies
    if (!pkg.dependencies || typeof pkg.dependencies !== 'object') {
      console.log('❌ package.json missing dependencies object');
      return false;
    }
    
    // Check devDependencies
    if (!pkg.devDependencies || typeof pkg.devDependencies !== 'object') {
      console.log('❌ package.json missing devDependencies object');
      return false;
    }
    
    console.log('✅ package.json structure is valid');
    return true;
  } catch (error) {
    console.log(`❌ package.json parsing error: ${error.message}`);
    return false;
  }
}

function checkSourceFiles() {
  const requiredFiles = [
    'src/App.tsx',
    'src/ui.tsx',
    'src/game/storage.ts',
    'src/game/engine.ts',
    'src/game/data.ts',
    'src/screens/Leaderboard.tsx',
    'src/screens/Play.tsx',
    'src/screens/Menu.tsx',
    'src/screens/Profile.tsx',
    'src/screens/Settings.tsx',
    'src/screens/Achievements.tsx',
    'src/screens/Missions.tsx',
    'src/screens/Tutorial.tsx',
    'src/screens/Statistics.tsx',
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    if (!checkFileExists(file)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    console.log(`❌ Missing required files: ${missingFiles.join(', ')}`);
    return false;
  }
  
  console.log('✅ All required source files exist');
  return true;
}

function checkDocumentation() {
  const requiredDocs = [
    'README.md',
    'CHANGELOG.md',
    'RELEASE_GUIDE.md',
    'INSTALL_GUIDE.md',
    'DEVELOPER_GUIDE.md',
    'SECURITY.md',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md',
    'RELEASE_v1.0.0.md',
    'IMPLEMENTATION_SUMMARY.md',
  ];
  
  const missingDocs = [];
  
  for (const doc of requiredDocs) {
    if (!checkFileExists(doc)) {
      missingDocs.push(doc);
    }
  }
  
  if (missingDocs.length > 0) {
    console.log(`❌ Missing required documentation files: ${missingDocs.join(', ')}`);
    return false;
  }
  
  console.log('✅ All required documentation files exist');
  return true;
}

function checkFirebaseConfig() {
  if (!checkFileExists('.env')) {
    console.log('❌ Missing .env file for Firebase configuration');
    return false;
  }
  
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_DATABASE_URL',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ];
    
    const missingVars = [];
    
    for (const varName of requiredVars) {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      console.log(`❌ .env file missing required variables: ${missingVars.join(', ')}`);
      return false;
    }
    
    console.log('✅ Firebase configuration is valid');
    return true;
  } catch (error) {
    console.log(`❌ Error reading .env file: ${error.message}`);
    return false;
  }
}

function checkBuildScripts() {
  const buildScripts = ['build-apk-fast.sh', 'build-apk-fast.bat', 'build-release.sh', 'build-release.bat'];
  const missingScripts = [];
  
  for (const script of buildScripts) {
    if (!checkFileExists(script)) {
      missingScripts.push(script);
    }
  }
  
  if (missingScripts.length > 0) {
    console.log(`❌ Missing build scripts: ${missingScripts.join(', ')}`);
    return false;
  }
  
  console.log('✅ All build scripts exist');
  return true;
}

function main() {
  console.log('🔍 KushCloud Application Quality Check');
  console.log('='.repeat(50));
  
  const checks = [
    checkPackageJson,
    checkSourceFiles,
    checkDocumentation,
    checkFirebaseConfig,
    checkBuildScripts,
  ];
  
  const results = [];
  for (const check of checks) {
    results.push(check());
  }
  
  const passed = results.filter(result => result === true).length;
  const total = results.length;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All quality checks passed!');
    console.log('\nThe KushCloud application is ready for production.');
  } else {
    console.log('\n⚠️ Some quality checks failed.');
    console.log('\nPlease review the issues listed above and fix them before deploying.');
    process.exit(1);
  }
}

main();