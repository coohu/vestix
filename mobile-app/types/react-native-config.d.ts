declare module 'react-native-config' {
  type ConfigValue = string | number | boolean | undefined | null | Record<string, any>;
  const Config: { [key: string]: ConfigValue };
  export default Config;
}
