const fs = require('fs');
const path = require('path');

function processFile(filePath, platform) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    if (platform === 'web') {
        // Find alert('...') or alert(`...`)
        content = content.replace(/\balert\((['"`])(.*?)\1\)/g, (match, quote, msg) => {
            let type = 'info';
            const lowerMsg = msg.toLowerCase();
            if (lowerMsg.includes('fail') || lowerMsg.includes('error')) type = 'error';
            else if (lowerMsg.includes('success')) type = 'success';
            else if (lowerMsg.includes('cancel')) type = 'cancel';
            else if (lowerMsg.includes('pending') || lowerMsg.includes('wait')) type = 'pending';
            
            return `window.showAppAlert(${quote}${msg}${quote}, '${type}')`;
        });
        
        // Handle alert(err.response?.data?.message || '...')
        content = content.replace(/\balert\(([^'"\s][^)]+)\)/g, (match, expr) => {
            if (expr.includes('showAppAlert')) return match; // skip already replaced
            let type = 'info';
            const lowerExpr = expr.toLowerCase();
            if (lowerExpr.includes('fail') || lowerExpr.includes('error')) type = 'error';
            else if (lowerExpr.includes('success')) type = 'success';
            
            return `window.showAppAlert(${expr}, '${type}')`;
        });
    } else if (platform === 'mobile') {
        // Mobile uses Alert.alert('Title', 'Message', buttons?)
        // Let's replace Alert.alert(...) with global.showAppAlert(...)
        // Since Alert.alert arguments can span multiple lines, we need a smarter replace or just simple regex for one-liners
        // Actually, let's just replace Alert.alert with global.showAppAlert
        content = content.replace(/\bAlert\.alert\(/g, 'global.showAppAlert(');
        
        // Also replace any generic alert() in mobile if they exist
        content = content.replace(/\balert\(([^)]+)\)/g, (match, expr) => {
            if (expr.includes('showAppAlert')) return match;
            return `global.showAppAlert('Notice', ${expr})`;
        });
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walk(dir, platform) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath, platform);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath, platform);
        }
    }
}

const webSrc = path.join(__dirname, 'web', 'entercom', 'src');
const mobileApp = path.join(__dirname, 'mobile', 'app');
const mobileSrc = path.join(__dirname, 'mobile', 'src');

walk(webSrc, 'web');
walk(mobileApp, 'mobile');
walk(mobileSrc, 'mobile');

console.log("Done refactoring alerts.");
