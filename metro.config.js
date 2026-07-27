const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// 🔥 FIX: Allow Metro to bundle Firebase's .cjs files
defaultConfig.resolver.sourceExts.push('cjs');

// 🔥 FIX: Disable package exports to prevent module resolution conflicts
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;