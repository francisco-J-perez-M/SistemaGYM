// metro.config.js — Configuración Metro bundler para Expo Router (SDK 56)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver extensiones adicionales
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Polyfills para módulos Node.js que algunos paquetes importan (react-native-svg → buffer)
// react-native-svg 15.x importa 'buffer' de Node stdlib; este alias apunta al
// paquete npm 'buffer' que es compatible con React Native / browser.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
};

module.exports = config;
