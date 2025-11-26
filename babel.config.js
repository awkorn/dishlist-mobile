module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@features': './src/features',
            '@components': './src/components',
            '@lib': './src/lib',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@providers': './src/providers',
            '@navigation': './src/navigation',
            '@app-types': './src/types',
            '@app-types/*': './src/types/*',
            '@styles': './src/styles',
            '@utils': './src/utils',
          },
        },
      ],
    ],
  };
};