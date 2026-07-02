# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep Moshi and models serialization names correct
-keepclassmembers class * {
    @com.squareup.moshi.Json <fields>;
}
-keep class com.example.model.** { *; }

# Keep Retrofit interface and OkHttp mechanics stable
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepclassmembers class * {
    @retrofit2.http.** <methods>;
}

-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
-dontwarn okio.**
-keep class okio.** { *; }

# General code obfuscation optimizations
-repackageclasses ''
-allowaccessmodification
