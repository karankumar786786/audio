const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo, preserving existing watch folders
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// Let Metro resolve packages from the workspace root node_modules
config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths || []),
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force absolute path for EXPO_ROUTER_APP_ROOT to resolve require.context issue in monorepo
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, 'app');

module.exports = withNativeWind(config, { input: './global.css' });
