# Fastlane (iOS)

Run on a Mac with Xcode and a paid Apple Developer account:

```bash
bundle exec fastlane ios sync
bundle exec fastlane ios metadata
bundle exec fastlane ios release
```

Set `APP_STORE_CONNECT_API_KEY_PATH` or use `app_store_connect_api_key` in Fastfile after creating a key in App Store Connect → Users and Access → Integrations.
