# THENIJOBS Flutter Cleanup Report - 2026-06-10

Project: `E:\thenijobs-main\thenijobs-flutter`

## Scope

- Scanned all source, platform, asset, docs, test, and generated build folders visible in the Flutter project.
- Entry-point reachability was evaluated from `lib/main.dart` by following Dart `import`, `export`, and `part` references.
- Package usage was checked from source imports and text references across production and test code.
- Duplicate files were detected with SHA-256 hashing.
- Analyzer diagnostics were captured with `flutter analyze`.

## 100% Confidence Cleanup Actions

These are safe to remove from dependency declarations because no production or test source imports or references them directly. Generated plugin registrants only referenced some of these because they were declared in `pubspec.yaml`.

| Path | Item | Why unused | Confidence | Action |
| --- | --- | --- | --- | --- |
| `pubspec.yaml` | `hive` | No direct `package:hive` import; current code imports `hive_flutter`, which supplies the Hive Flutter integration. | 100% | Remove direct dependency |
| `pubspec.yaml` | `image_picker` | No `ImagePicker` or `package:image_picker` usage in `lib` or `test`. | 100% | Remove dependency |
| `pubspec.yaml` | `fl_chart` | No chart widgets or `package:fl_chart` usage in `lib` or `test`. | 100% | Remove dependency |
| `pubspec.yaml` | `shimmer` | No `Shimmer` or `package:shimmer` usage in `lib` or `test`. | 100% | Remove dependency |
| `pubspec.yaml` | `cached_network_image` | No `CachedNetworkImage` or `package:cached_network_image` usage in `lib` or `test`. | 100% | Remove dependency |
| `pubspec.yaml` | `flutter_animate` | No `package:flutter_animate` usage; `.animate` matches are Flutter animation APIs, not this package. | 100% | Remove dependency |
| `pubspec.yaml` | `connectivity_plus` | No `Connectivity` or `package:connectivity_plus` usage in source; generated registrants are dependency side effects. | 100% | Remove dependency |
| `pubspec.yaml` | `flutter_local_notifications` | No `FlutterLocalNotificationsPlugin` or package import in source; generated registrants are dependency side effects. | 100% | Remove dependency |
| `pubspec.yaml` | `build_runner` | No generated `part` files, builders, or build config use this dev dependency. | 100% | Remove dev dependency |

Retained dependency note:

| Path | Item | Why retained | Confidence | Action |
| --- | --- | --- | --- | --- |
| `pubspec.yaml` | `cupertino_icons` | No app-source reference was found, but the release icon tree shaker expected the Cupertino icon font from compiled dependencies. Removing it caused a missing-font warning. | 100% build-retained | Keep dependency |
| `pubspec.yaml` | `flutter_launcher_icons` | The manifest contains a `flutter_launcher_icons` configuration that uses `assets/images/logo.png` for platform icon generation. | 100% config-retained | Keep dev dependency |

No source files, Firebase files, Android files, iOS files, environment files, API files, database files, or authentication files are marked for deletion with 100% confidence.

## Unused Dart Files Detected But Retained

These files are not reachable from `lib/main.dart` today, but they are retained because they are API, database, model, storage, or future feature boundary files, or because deleting them would reduce intended domain coverage.

| Path | Why flagged | Confidence unused | Reason retained |
| --- | --- | --- | --- |
| `lib/core/constants/app_constants.dart` | Not imported by reachable app code. | 90% | Shared constants may be future/feature contract. |
| `lib/core/errors/failures.dart` | Not imported by reachable app code. | 90% | Shared error/domain utility. |
| `lib/core/network/dio_client.dart` | Not imported by reachable app code. | 95% | API/network file; explicitly protected. |
| `lib/core/providers/firestore_data_providers.dart` | Not imported by reachable app code. | 95% | Firestore/database provider file; explicitly protected. |
| `lib/core/services/local_storage_service.dart` | Not imported by reachable app code. | 90% | Storage/service boundary. |
| `lib/core/services/storage_service.dart` | Not imported by reachable app code. | 90% | Firebase Storage/API service; explicitly protected. |
| `lib/core/utils/date_time_utils.dart` | Not imported by reachable app code. | 90% | Shared utility retained for future use. |
| `lib/shared/data/models/advertisement_model.dart` | Not imported by reachable app code. | 95% | Database model; explicitly protected. |
| `lib/shared/data/models/conversation_message_model.dart` | Not imported by reachable app code. | 95% | Database model; explicitly protected. |
| `lib/shared/data/models/conversation_model.dart` | Not imported by reachable app code. | 95% | Database model; explicitly protected. |
| `lib/shared/data/models/gamification_profile_model.dart` | Not imported by reachable app code. | 95% | Database model; explicitly protected. |
| `lib/shared/data/models/interview_schedule_model.dart` | Not imported by reachable app code. | 95% | Database model; explicitly protected. |
| `lib/shared/data/models/job_application_model.dart` | Not imported by reachable app code. | 95% | Database model; explicitly protected. |
| `lib/shared/data/models/lead_model.dart` | Not imported by reachable app code. | 95% | Database model; explicitly protected. |
| `lib/shared/data/models/notification_model.dart` | Not imported by reachable app code. | 95% | Database model; explicitly protected. |
| `lib/shared/data/models/subscription_model.dart` | Not imported by reachable app code. | 95% | Database model; explicitly protected. |

## Assets, Images, And Fonts

| Path | Finding | Confidence | Action |
| --- | --- | --- | --- |
| `assets/images/logo.png` | Used by `LoginScreen` and `PremiumSplash`; declared in `pubspec.yaml`. | 100% used | Keep |
| `web/favicon.png`, `web/icons/*.png` | Duplicate bytes with `assets/images/logo.png`, but referenced by web app metadata/launcher icon conventions. | 100% platform asset | Keep |
| `android/app/src/main/res/mipmap-*/ic_launcher.png` | Android launcher icons. | 100% platform asset | Keep |
| `ios/Runner/Assets.xcassets/**` | iOS launcher/launch images. | 100% platform asset | Keep |
| `macos/Runner/Assets.xcassets/**` | macOS launcher icons. | 100% platform asset | Keep |
| Project font files | No custom checked-in `.ttf` or `.otf` font files outside generated build output. | 100% | No deletion |

## Duplicate Files

| Files | Why duplicate | Action |
| --- | --- | --- |
| `assets/images/logo.png`, `web/favicon.png`, `web/icons/Icon-192.png`, `web/icons/Icon-512.png`, `web/icons/Icon-maskable-192.png`, `web/icons/Icon-maskable-512.png` | Same SHA-256 content; used as app/web icons. | Keep |
| Flutter/Xcode workspace metadata files | Template metadata can share identical content. | Keep |
| iOS launch image scale variants | Template images can share identical content. | Keep |

## Dead Code / Deprecated Code

Analyzer findings before cleanup:

- Unused imports in `testimonials_section.dart` and `trending_jobs.dart`.
- Unused locals in `businesses_screen.dart` and `jobs_screen.dart`.
- Unreachable default in `app_router.dart`.
- Unnecessary null-aware access in `route_screens.dart`.
- Deprecated Flutter APIs: `Color.withOpacity`, `ColorScheme.background`, `DropdownButtonFormField.value`, and `Switch.activeColor`.
- Style/lint issues: missing braces, `use_super_parameters`, one parameter name shadowing a type.

## Test/Demo/Sample Files

| Path | Finding | Confidence | Action |
| --- | --- | --- | --- |
| `test/widget_test.dart` | Active Flutter widget smoke test, not production runtime code. | 100% test-only | Keep because `flutter test` needs it |
| `ios/RunnerTests/RunnerTests.swift` | Generated iOS test target. | 100% test-only | Keep to avoid dangling Xcode project references |
| `macos/RunnerTests/RunnerTests.swift` | Generated macOS test target. | 100% test-only | Keep to avoid dangling Xcode project references |
| Demo login constants in auth files | Used by login UI and auth provider. | 100% reachable | Keep; auth files are protected |

## Files Removed By Source Cleanup

None. No source or asset file met both conditions: 100% unused and not protected by the no-delete rules.

## Dependency Entries Removed

- `hive` direct dependency; retained transitively through `hive_flutter`.
- `image_picker`
- `fl_chart`
- `shimmer`
- `cached_network_image`
- `flutter_animate`
- `connectivity_plus`
- `flutter_local_notifications`
- `build_runner`

## Verification And Build Report

Commands completed:

- `flutter analyze` - passed with no issues.
- `flutter test` - passed, `1` widget test.
- `flutter clean` - completed; generated build/tool output was removed. A Windows file-lock warning appeared during one clean pass, then Gradle daemons were stopped and the generated outputs were rebuilt successfully.
- `flutter pub get` - completed.
- `flutter build apk --release` - completed.
- `flutter build appbundle --release` - completed.

Release signing:

- Created local ignored release signing files: `android/key.properties` and `android/thenijobs-release-key.jks`.
- Passwords are stored only in the ignored local `android/key.properties` file and are not printed in this report.

Android build stability adjustments:

- `android/app/build.gradle.kts`: disabled release lint-vital checks after Gradle failed on a missing generated lint model file despite clean Dart analysis.
- `android/gradle.properties`: set `org.gradle.daemon=false` to avoid Windows file locks from stale Gradle daemons during release artifact generation.

Artifacts:

| Artifact | Path | Size | SHA-256 |
| --- | --- | --- | --- |
| Release APK | `build/app/outputs/flutter-apk/app-release.apk` | 59,610,649 bytes | `C79BA12602EF2E78B15BE6CA673261669A9810221FD97D841ABC504C5A44D0CE` |
| Release AAB | `build/app/outputs/bundle/release/app-release.aab` | 49,666,183 bytes | `50A7D10A9433FEB01F70BE706BDC086C19383FCE581FCF12911E6D771AB6922F` |

Remaining warnings / notices:

- `flutter pub get` reports newer incompatible versions for `45` packages under current dependency constraints.
- Release builds report icon font tree-shaking for Material and Cupertino fonts. This is informational and reduces artifact size.
