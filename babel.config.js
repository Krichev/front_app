module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          app: './src/app',
          pages: './src/pages',
          widgets: './src/widgets',
          features: './src/features',
          entities: './src/entities',
          shared: './src/shared',
        },
      },
    ],
  ],
};