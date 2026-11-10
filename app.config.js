const appJson = require('./app.json');

module.exports = ({ config }) => {
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    config.extra?.eas?.projectId ||
    appJson.expo.extra?.eas?.projectId;

  return {
    ...config,
    extra: {
      ...config.extra,
      ...(projectId
        ? {
            eas: {
              ...config.extra?.eas,
              projectId,
            },
          }
        : {}),
    },
  };
};
