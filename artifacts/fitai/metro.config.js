const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..", "..");

const config = getDefaultConfig(projectRoot);

// Monorepo + pnpm hoisted layout (Windows / OneDrive): Metro watches the workspace root
// so shared hoisted node_modules resolve consistently with expo-router.
config.watchFolders = [workspaceRoot];

module.exports = config;
