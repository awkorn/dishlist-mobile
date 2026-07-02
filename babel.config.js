module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@features": "./src/features",
            "@components": "./src/components",
            "@lib": "./src/lib",
            "@services": "./src/services",
            "@hooks": "./src/hooks",
            "@providers": "./src/providers",
            "@navigation": "./src/navigation",
            "@app-types": "./src/types",
            "@app-types/*": "./src/types/*",
            "@styles": "./src/styles",
            "@utils": "./src/utils",
          },
        },
        "react-native-reanimated/plugin",
      ],
    ],
    env: {
      production: {
        // Console calls cost time/memory on device; keep errors and warnings
        // so crash reporting and yellow-box signals survive in release builds.
        plugins: [
          ["transform-remove-console", { exclude: ["error", "warn"] }],
        ],
      },
    },
  };
};