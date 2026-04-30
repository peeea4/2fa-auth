---
name: 2FA Auth iOS App
overview: Полный план разработки production-ready 2FA Authenticator приложения для iOS на базе React Native (Expo), с локальным шифрованием, TOTP генерацией и монетизацией через Adapty.
todos:
  - id: project-setup
    content: "Инициализировать Expo проект: `npx create-expo-app@latest 2fa-auth --template blank-typescript`, настроить EAS, app.json (bundle id, version, iOS-only)"
    status: completed
  - id: deps-install
    content: "Установить все зависимости: expo-router, zustand, otplib, expo-secure-store, react-native-mmkv, expo-camera, expo-local-authentication, react-native-adapty, i18next, react-i18next, expo-localization, react-native-reanimated, react-native-gesture-handler, nativewind, lucide-react-native"
    status: completed
  - id: folder-structure
    content: "Создать полную структуру папок: app/, components/, services/, stores/, hooks/, i18n/, constants/, types/"
    status: completed
  - id: types-constants
    content: Определить все TypeScript типы (OtpEntry, AuthState, PremiumState) и константы (FREE_CODE_LIMIT, colors, config)
    status: completed
  - id: i18n-setup
    content: Настроить i18next + expo-localization, создать файлы переводов для EN/ES/FR/RU
    status: pending
  - id: storage-service
    content: "Реализовать storage.service.ts: абстракция над expo-secure-store (секреты) и MMKV (метаданные)"
    status: pending
  - id: otp-service
    content: "Реализовать otp.service.ts: генерация TOTP через otplib, парсинг otpauth:// URI из QR"
    status: pending
  - id: crypto-service
    content: "Реализовать crypto.service.ts: хэширование PIN (bcrypt/sha256), вспомогательные функции шифрования"
    status: pending
  - id: biometric-service
    content: "Реализовать biometric.service.ts: проверка доступности, запрос аутентификации, fallback на PIN"
    status: pending
  - id: adapty-service
    content: "Реализовать adapty.service.ts: инициализация SDK, проверка статуса подписки, показ paywall"
    status: pending
  - id: zustand-stores
    content: "Реализовать все Zustand stores: otp.store, auth.store, premium.store, settings.store с персистентностью через MMKV"
    status: pending
  - id: hooks
    content: "Реализовать hooks: useOtpTimer (глобальный countdown), useBiometrics, usePremium, useTheme"
    status: pending
  - id: navigation-layout
    content: "Настроить Expo Router: root _layout.tsx с auth gate, (tabs) layout с bottom tabs, modal presentations"
    status: pending
  - id: ui-components
    content: "Создать базовые UI компоненты: Button, Input, Sheet (bottom sheet), EmptyState, PremiumBadge"
    status: pending
  - id: lock-screen
    content: "Реализовать Lock Screen: PIN pad компонент + BiometricPrompt, логика блокировки при сворачивании приложения (AppState)"
    status: pending
  - id: onboarding
    content: "Реализовать Onboarding: 3-4 слайда с Reanimated анимациями, пагинация, сохранение флага завершения"
    status: pending
  - id: otp-card
    content: "Реализовать OtpCard компонент: отображение кода, CountdownBar (Reanimated), tap-to-copy с haptic feedback"
    status: pending
  - id: home-screen
    content: "Реализовать Home screen: OtpList, поиск, FAB с вариантами добавления, premium gate overlay на 6+ карточках"
    status: pending
  - id: add-manual
    content: "Реализовать Manual Add screen: форма (issuer, account, secret, algorithm, digits, period), валидация, сохранение"
    status: pending
  - id: add-qr
    content: "Реализовать QR Scanner screen: expo-camera fullscreen, прицел-оверлей, парсинг otpauth://, premium gate"
    status: pending
  - id: edit-delete
    content: "Реализовать Edit/Delete flow: long-press на карточке → action sheet, edit modal, подтверждение удаления"
    status: pending
  - id: paywall-screen
    content: "Реализовать Paywall screen: интеграция с Adapty, продуктовые карточки, restore purchases, dismiss flow"
    status: pending
  - id: settings-screen
    content: "Реализовать Settings screen: секции Security (PIN, Biometric), Appearance (тема), Language, About, Upgrade to Premium"
    status: pending
  - id: theming
    content: "Реализовать систему тем: light/dark/system, NativeWind конфигурация, tokens в constants/colors.ts"
    status: pending
  - id: privacy-manifest
    content: "Создать PrivacyInfo.xcprivacy для App Store: задекларировать использование Camera, FaceID/TouchID, UserDefaults"
    status: pending
  - id: app-store-assets
    content: "Подготовить App Store assets: иконка (1024x1024), splash screen, скриншоты для всех размеров iPhone"
    status: pending
  - id: eas-build
    content: "Настроить EAS Build: eas.json профили (development, preview, production), подписание для iOS"
    status: pending
  - id: testing
    content: "Написать тесты для критической бизнес-логики: otp.service, storage.service, premium gating логика"
    status: pending
isProject: false
---

# 2FA Authenticator — Production iOS App Plan

## Git Workflow Rule (Mandatory For Every Task)

- Каждый шаг из task list выполняется в **отдельной feature-ветке**
- Базовая ветка для всех feature-веток: `development`
- Именование веток: `feature/<todo-id>-<short-description>`
- Для каждого шага обязателен отдельный коммит (или серия логичных коммитов в рамках этого шага)
- После завершения шага обязателен Pull Request: `feature/*` → `development`
- Переход к следующему шагу только после создания PR по текущему шагу
- Это правило применяется **после каждого пункта плана без исключений** (включая `todos` в header и основные разделы ниже)

### Standard Flow For Each Task

1. Обновить `development`: `git checkout development && git pull`
2. Создать ветку задачи: `git checkout -b feature/<todo-id>-<short-description>`
3. Выполнить только scope текущего шага
4. Прогнать проверки (lint/tests/build)
5. Закоммитить изменения с осмысленным сообщением
6. Запушить ветку: `git push -u origin feature/<...>`
7. Создать PR в `development`
8. После PR перейти обратно в `development` и начать следующий шаг в новой feature-ветке

### Mandatory Post-Task Block (Append After Every Plan Item)

После выполнения **каждого** пункта плана обязательно выполнить следующие действия в указанном порядке:

1. Создать feature-ветку от `development`: `git checkout -b feature/<todo-id>-<short-description>`
2. Закоммитить реализацию пункта в эту ветку: `git add . && git commit -m "<type>: <todo-id>"`
3. Запушить ветку и открыть Pull Request в `development`: `git push -u origin feature/<...>` + PR `feature/*` → `development`

Если эти 3 шага не выполнены, пункт считается незавершённым.

## Code Quality Rule (Mandatory): Biome

- В проекте обязателен **Biome** как единый formatter + linter
- Настроить `biome.json` на раннем этапе (сразу после инициализации проекта)
- Добавить npm scripts:
  - `lint`: `biome check .`
  - `lint:fix`: `biome check --write .`
  - `format`: `biome format --write .`
- Каждый шаг (каждая feature-ветка) должен завершаться запуском `lint` и исправлением замечаний до коммита
- PR не создаётся, пока `biome check .` не проходит без ошибок

## 1. Architecture Decisions

### Navigation: Expo Router v3 (file-based)
- Нативный iOS swipe-back из коробки через `react-navigation` под капотом
- Bottom tabs через `(tabs)` layout group
- Modals через `_layout.tsx` с `presentation: "modal"`
- Простая структура, понятная AI-ассистентам при генерации кода

### Storage + Encryption
- **expo-secure-store** для OTP secrets (AES-256 через iOS Keychain)
- **MMKV** (через `expo-community-flipper` или `react-native-mmkv`) для не-секретных данных: настройки, тема, онбординг-флаг
- Каждый OTP-секрет хранится отдельным ключом в Keychain: `otp_secret_<id>`
- Метаданные (name, issuer, algorithm, digits, period) хранятся в MMKV как JSON-массив (не секретны)
- Стратегия: split storage — secrets в Keychain, metadata в MMKV

### State Management: Zustand
- `useOtpStore` — список записей + CRUD
- `useAuthStore` — состояние блокировки (locked/unlocked), PIN, биометрия
- `usePremiumStore` — статус подписки, лимиты
- `useSettingsStore` — тема, язык

### OTP Generation
- `otplib` — стандарт де-факто, поддерживает TOTP RFC 6238
- Singleton `OtpService` с кешированием текущего токена и следующего

### Biometrics: `expo-local-authentication`

### QR Scanning: `expo-camera` с `expo-barcode-scanner`

### Monetization: Adapty React Native SDK

### Localization: `i18next` + `react-i18next` + `expo-localization`

### Icons: `@expo/vector-icons` (SF Symbols через Ionicons fallback) + `lucide-react-native`

---

## 2. Tech Stack

- **Framework**: Expo SDK 52+ (managed workflow → eject при необходимости)
- **Language**: TypeScript strict mode
- **Navigation**: Expo Router v3
- **State**: Zustand 5
- **Secure Storage**: expo-secure-store (Keychain)
- **Fast Storage**: react-native-mmkv
- **OTP**: otplib
- **QR**: expo-camera + expo-barcode-scanner
- **Biometrics**: expo-local-authentication
- **Monetization**: react-native-adapty
- **i18n**: i18next + react-i18next + expo-localization
- **Animations**: react-native-reanimated 3
- **Gestures**: react-native-gesture-handler
- **UI primitives**: собственные + NativeWind (Tailwind для RN)
- **Testing**: Jest + React Native Testing Library
- **Lint/Format**: Biome (mandatory)

---

## 3. Folder Structure

```
src/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (auth gate)
│   ├── onboarding/
│   │   └── index.tsx
│   ├── paywall.tsx               # Modal
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tabs
│   │   ├── index.tsx             # Home (OTP list)
│   │   └── settings.tsx
│   ├── add/
│   │   ├── _layout.tsx
│   │   ├── scan.tsx              # QR full screen
│   │   └── manual.tsx            # Manual entry modal
│   ├── edit/
│   │   └── [id].tsx
│   └── lock.tsx                  # Lock screen (PIN/Biometric)
│
├── components/
│   ├── otp/
│   │   ├── OtpCard.tsx
│   │   ├── OtpCode.tsx
│   │   ├── CountdownBar.tsx
│   │   └── OtpList.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Sheet.tsx             # Bottom sheet
│   │   ├── EmptyState.tsx
│   │   └── PremiumBadge.tsx
│   ├── paywall/
│   │   └── PaywallScreen.tsx
│   ├── onboarding/
│   │   └── OnboardingSlider.tsx
│   └── lock/
│       ├── PinPad.tsx
│       └── BiometricPrompt.tsx
│
├── services/
│   ├── otp.service.ts            # TOTP generation
│   ├── crypto.service.ts         # Encryption helpers
│   ├── storage.service.ts        # Keychain + MMKV abstraction
│   ├── adapty.service.ts         # Paywall / subscription
│   └── biometric.service.ts     # Auth check
│
├── stores/
│   ├── otp.store.ts
│   ├── auth.store.ts
│   ├── premium.store.ts
│   └── settings.store.ts
│
├── hooks/
│   ├── useOtpTimer.ts            # Global countdown sync
│   ├── useBiometrics.ts
│   ├── usePremium.ts
│   └── useTheme.ts
│
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── en.json
│       ├── es.json
│       ├── fr.json
│       └── ru.json
│
├── constants/
│   ├── colors.ts
│   ├── limits.ts                 # FREE_CODE_LIMIT = 5
│   └── config.ts
│
└── types/
    ├── otp.types.ts
    └── adapty.types.ts
```

---

## 4. Data Models

### OtpEntry (хранится в MMKV как JSON массив)
```typescript
interface OtpEntry {
  id: string;           // uuid v4
  issuer: string;       // "Google", "GitHub"
  account: string;      // "user@example.com"
  algorithm: "SHA1" | "SHA256" | "SHA512";
  digits: 6 | 8;
  period: 30 | 60;      // секунды
  createdAt: number;    // timestamp
  iconUrl?: string;     // будущее
  color?: string;       // accent для карточки
}
// Секрет хранится отдельно: SecureStore.getItem(`otp_secret_${id}`)
```

### AuthState (Zustand, не персистится)
```typescript
interface AuthState {
  isLocked: boolean;
  isPinSet: boolean;
  isBiometricEnabled: boolean;
  failedAttempts: number;
}
```

### PremiumState
```typescript
interface PremiumState {
  isPremium: boolean;
  expiresAt: number | null;
  productId: string | null;
}
```

---

## 5. Screen Map

```
App Start
  └─ Lock Screen (если PIN/Biometric включён)
       └─ Biometric prompt → или PIN pad
            └─ (tabs)
                 ├─ Home (index)
                 │    ├─ Search bar
                 │    ├─ OTP Card List
                 │    │    └─ Long press → Edit / Delete
                 │    ├─ FAB "+" 
                 │    │    ├─ "Scan QR" → Premium gate → scan.tsx
                 │    │    └─ "Enter manually" → manual.tsx (modal)
                 │    └─ 5-code limit → Paywall modal
                 └─ Settings
                      ├─ Premium / Upgrade → Paywall
                      ├─ Security (PIN, Biometric)
                      ├─ Theme (Light/Dark/System)
                      ├─ Language
                      └─ About

Onboarding (первый запуск)
  └─ 3-4 слайда → Paywall (опционально) → Home

Paywall (modal)
  └─ Продуктовые карточки Adapty → Purchase → Dismiss
```

---

## 6. Critical Logic

### TOTP Generation Lifecycle
- Единый глобальный интервал в `useOtpTimer` hook на уровне root layout
- Каждые 1000ms обновляет `remainingSeconds = period - (Date.now()/1000 % period)`
- При `remainingSeconds === period` — инвалидирует кеш токенов и пересчитывает все коды
- Передаёт через Zustand или Context `{ timeLeft, shouldRefresh }`

### Premium Gating
```
FREE_CODE_LIMIT = 5
canAddCode = isPremium || otpList.length < FREE_CODE_LIMIT
canScanQR = isPremium
canUseBiometric = isPremium
```

### PIN Storage
- PIN хранится как bcrypt hash в SecureStore (`otp_pin_hash`)
- Никогда не хранить PIN в открытом виде

---

## 7. UX Decisions

- **Countdown bar**: `react-native-reanimated` `useSharedValue` → плавная анимация без JS thread jank
- **Copy feedback**: `Haptics.impactAsync(Heavy)` + кратковременный toast "Copied!"
- **Premium gate**: полупрозрачный overlay на заблокированных карточках + иконка замка
- **Empty state**: иллюстрация + CTA "Add your first account"
- **QR scanner**: fullscreen с вырезанным квадратом-прицелом, автозакрытие после успешного скана

---

## 8. Future-Proofing (iCloud / Backup)

- `storage.service.ts` обёртывает все операции → при добавлении iCloud достаточно заменить имплементацию
- Метаданные в MMKV можно сериализовать в JSON → готовы к экспорту/импорту
- Secrets через Keychain → iCloud Keychain sync можно включить флагом `kSecAttrSynchronizable`

---

## 9. Risks & Edge Cases

- **Clock drift**: TOTP критичен к системному времени → показывать предупреждение если время устройства неточно
- **Migration**: при обновлении структуры данных нужна версионность схемы в MMKV
- **Biometric fallback**: если биометрия недоступна → всегда предлагать PIN
- **SecureStore лимиты**: каждый элемент ≤ 2048 байт (секрет base32 вписывается)
- **App Store**: нужен Privacy Manifest (`PrivacyInfo.xcprivacy`) для Camera + Biometrics
- **Adapty**: требует реального Apple Developer аккаунта для тестирования StoreKit
- **Git process risk**: если делать несколько шагов в одной ветке, PR станет слишком большим и сложным для ревью → строго 1 шаг = 1 feature-ветка = 1 PR
