module.exports = function (api) {
  api.cache(true);

  // Check the caller to identify if we are bundling for the mobile app via Metro,
  // falling back to cwd verification to support all starting directories.
  const projectRoot = api.caller(caller => caller && caller.projectRoot);
  const isMobile = (projectRoot && projectRoot.includes('audioMobileApp')) || process.cwd().includes('audioMobileApp');

  if (isMobile) {
    return {
      presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
      plugins: [
        'react-native-worklets/plugin',
        ['@babel/plugin-transform-class-properties', { loose: true }],
        ['@babel/plugin-transform-private-methods', { loose: true }],
        ['@babel/plugin-transform-private-property-in-object', { loose: true }]
      ]
    };
  }

  // Return empty configuration for other packages to prevent interference
  return {};
};
