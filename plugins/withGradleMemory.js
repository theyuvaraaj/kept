// Config plugin: raise the Gradle daemon's JVM memory during Android builds.
// The default Expo/RN template sets `-Xmx2048m -XX:MaxMetaspaceSize=512m`,
// which OOMs (Metaspace) at :app:mergeExtDexRelease on this app's module count
// during a local `eas build`. Since prebuild regenerates android/ every build,
// we rewrite gradle.properties via a config plugin so the bump is durable.
const { withGradleProperties } = require('@expo/config-plugins');

const JVM_ARGS =
  '-Xmx4096m -XX:MaxMetaspaceSize=2048m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8';

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const set = (key, value) => {
      const existing = props.find((p) => p.type === 'property' && p.key === key);
      if (existing) existing.value = value;
      else props.push({ type: 'property', key, value });
    };
    set('org.gradle.jvmargs', JVM_ARGS);
    return cfg;
  });
};
