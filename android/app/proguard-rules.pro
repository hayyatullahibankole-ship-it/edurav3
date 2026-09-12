# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor core and plugins
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keepclassmembers class com.getcapacitor.Bridge {
    public *;
}
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
}

# Keep JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep the app package
-keep class com.akboy.edura.** { *; }

# Keep capacitor-cordova-android-plugins
-keep class com.akboy.edura.plugin.** { *; }

# Preserve line number information for debugging stack traces.
# -keepattributes SourceFile,LineNumberTable

# Hide the original source file name.
# -renamesourcefileattribute SourceFile
