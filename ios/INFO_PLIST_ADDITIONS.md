# iOS native permissions & orientation

> Note: the TestFlight workflow (`.github/workflows/ios-testflight.yml`) now
> automatically writes `UISupportedInterfaceOrientations` (and the `~ipad`
> variant) to portrait-only via PlistBuddy after `cap copy ios`. The block
> below is only needed if you generate the Xcode project locally and want
> the same lock baked in by hand.
>
> ```xml
> <key>UISupportedInterfaceOrientations</key>
> <array>
>   <string>UIInterfaceOrientationPortrait</string>
> </array>
> <key>UISupportedInterfaceOrientations~ipad</key>
> <array>
>   <string>UIInterfaceOrientationPortrait</string>
> </array>
> ```

# iOS native permissions

After running `npx cap add ios`, open `ios/App/App/Info.plist` and add the
following keys. These are required for the native Contacts picker
(`@capacitor-community/contacts`) used on the "Pick from Contacts" flow.

```xml
<key>NSContactsUsageDescription</key>
<string>Sphere uses your contacts only when you tap one to add them to your sphere. Your address book is never uploaded.</string>
```

The picker uses Apple's `CNContactPickerViewController`, which in practice
does not require Contacts permission to be "granted" up front (the user
explicitly taps a contact in Apple's UI). However, the
`@capacitor-community/contacts` plugin still calls
`requestAccess(for: .contacts)` before opening the picker, so the
`NSContactsUsageDescription` string is mandatory — the app will crash on
launch of the picker without it.

If you also wire push notifications later, add:

```xml
<key>NSUserNotificationsUsageDescription</key>
<string>Sphere notifies you when someone in your sphere matches with you.</string>
```

After editing, run:

```bash
npx cap sync ios
```
