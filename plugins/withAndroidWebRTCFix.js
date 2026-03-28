/**
 * Custom Expo Config Plugin: withAndroidWebRTCFix
 *
 * Fixes: "Duplicate class org.webrtc.* found in android-137.x.aar and webrtc-124.0.0.aar"
 *
 * Two-pronged strategy:
 * 1. Add configurations.all { exclude group: 'org.jitsi', module: 'webrtc' }
 *    to android/build.gradle (inside allprojects, OUTSIDE repositories block)
 * 2. Write pickFirst entries to android/gradle.properties so app/build.gradle
 *    picks first on duplicate .so files
 */
const { withProjectBuildGradle, withGradleProperties } = require("@expo/config-plugins");

function withJitsiExclusion(config) {
  return withProjectBuildGradle(config, function(config) {
    var gradle = config.modResults.contents;

    if (gradle.indexOf("exclude group: 'org.jitsi'") === -1) {
      // The allprojects block looks like:
      // allprojects {
      //   repositories {
      //     ...
      //   }
      // }
      // We need to insert configurations.all BEFORE the final closing brace of allprojects
      var exclusionBlock = [
        "",
        "  // WebRTC conflict fix: exclude org.jitsi:webrtc (conflicts with io.github.webrtc-sdk:android)",
        "  configurations.all {",
        "    exclude group: 'org.jitsi', module: 'webrtc'",
        "  }",
      ].join("\n");

      // Find the allprojects block and insert before its last closing brace
      gradle = gradle.replace(
        /(allprojects \{[\s\S]*?)(^\})/m,
        function(match, body, closingBrace) {
          return body + exclusionBlock + "\n" + closingBrace;
        }
      );
    }

    config.modResults.contents = gradle;
    return config;
  });
}

function withPickFirstProperties(config) {
  return withGradleProperties(config, function(config) {
    var props = config.modResults;
    var pickFirstKey = "android.packagingOptions.pickFirsts";
    var pickFirstValue = "**/libjingle_peerconnection_so.so,**/libjingle_peerconnection.so,**/libwebrtc.so";

    // Remove existing entry if present
    var idx = -1;
    for (var i = 0; i < props.length; i++) {
      if (props[i].type === "property" && props[i].key === pickFirstKey) {
        idx = i;
        break;
      }
    }
    if (idx !== -1) {
      props.splice(idx, 1);
    }

    // Add the pickFirst entry
    props.push({ type: "property", key: pickFirstKey, value: pickFirstValue });

    return config;
  });
}

module.exports = function withAndroidWebRTCFix(config) {
  config = withJitsiExclusion(config);
  config = withPickFirstProperties(config);
  return config;
};
