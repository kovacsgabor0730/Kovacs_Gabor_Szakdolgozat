module.exports = {
  name: "IdCard-app",
  slug: "IdCard-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.arcosharcos07.IdCardapp"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.arcosharcos07.IdCardapp"
  },
  extra: {
    apiUrl: "http://192.168.121.223:3000", // Itt definiáljuk az API URL-t
    eas: {
      projectId: "cd15c699-7a6e-4185-a32e-f1cf4ddd887c"
    }
  }
};