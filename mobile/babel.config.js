module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Esto es lo que habilita los gestos a 60 FPS
    ],
  };
};