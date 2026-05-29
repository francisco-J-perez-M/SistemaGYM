// babel.config.js
//
// SDK 56 / Reanimated 4.3.x / RN 0.85.3 (New Architecture - Fabric)
//
// babel-preset-expo ya incluye react-native-reanimated/plugin automáticamente
// al final del pipeline en SDK 56+. NO declararlo de nuevo aquí — ejecutarlo
// dos veces causa que la segunda pasada transforme módulos que ya fueron
// procesados, lo que en hooks personalizados produce stubs undefined para
// useState/useEffect/useCallback (crash "undefined is not a function").
//
// El fix real para ese crash está en useFetch.ts: acceder a los hooks vía
// React.useState en lugar de named imports, que Reanimated no puede interceptar.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
