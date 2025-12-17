# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

```bash
    npm install -g expo-cli
    # 或者使用 yarn
    # yarn global add expo-cli
    

   npm install -g eas-cli
    # 或者使用 yarn
    # yarn global add eas-cli
    

   eas login
   eas build:configure
   eas build --platform android --profile production
   npx expo install expo-image-picker
   npx expo install @expo/config-plugins@6.0.0 # 确保版本兼容
   npx expo-optimize # 优化图片

   java -jar bundletool.jar get-device-spec --output=device-spec.json
   bundletool.jar get-device-spec --output=device-spec.json
   bundletool.jar build-apks --bundle=application-2fb28d3e-edc8-404b-baad-5b4abbfaac4d.aab --output=app.apks --device-spec=device-spec.json
    
   # 安装
   bundletool.jar install-apks --apks=app.apks
   java -jar bundletool.jar install-apks --apks=app.apks
    
   adb devices
    
   #本地 build
   eas build --platform android --profile preview --local
   eas build --platform android --profile preview --local --output="./vestix.apk"
    
```
    