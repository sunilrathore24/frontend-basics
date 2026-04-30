# Torque Internationalization (i18n) — Overview

## Block Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APP STARTUP                                      │
│                                                                             │
│  ┌─────────────────────────┐    reads config     ┌───────────────────────┐  │
│  │ TrqLocaleInitializer    │◄────────────────────│  TrqConfigService     │  │
│  │ Service                 │                      │                       │  │
│  │ • sets default locale   │                      │ • locales.default     │  │
│  │ • subscribes to RTL     │                      │ • locales.fallback    │  │
│  └──────────┬──────────────┘                      │ • locales.ietf        │  │
│             │                                     │ • bundles.default     │  │
│             │ calls use(locale)                    └───────────────────────┘  │
│             ▼                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │                      TrqLocaleService                            │        │
│  │                                                                  │        │
│  │  • use(locale) ──► normalize locale format (IETF / Java)        │        │
│  │  • set fallback locale                                           │        │
│  │  • update Accept-Language HTTP header                            │        │
│  │  • exposes: onLocaleChange, onTranslationChange observables      │        │
│  │                                                                  │        │
│  │         wraps ──► @ngx-translate/core TranslateService           │        │
│  └──────────┬───────────────────────────────────┬───────────────────┘        │
│             │                                   │                            │
│             │ triggers bundle load               │ notifies                  │
│             ▼                                   ▼                            │
│  ┌─────────────────────────┐         ┌─────────────────────────────┐        │
│  │ TrqTranslateResource    │         │ TrqLocaleDirection          │        │
│  │ BundleLoader            │         │ Service                     │        │
│  │                         │         │                             │        │
│  │ • implements ngx-       │         │ • detects RTL/LTR           │        │
│  │   translate Loader      │         │ • RTL locales: ar, fa,      │        │
│  │ • calls fetchResource   │         │   iw, he, yi, ur            │        │
│  │   Bundle() for each     │         │ • sets dir="rtl"/"ltr"      │        │
│  │   registered bundle     │         │   on <html> element         │        │
│  │ • merges all bundles    │         └─────────────────────────────┘        │
│  │   into one flat map     │                                                │
│  └──────────┬──────────────┘                                                │
│             │                                                                │
│             │ delegates fetching                                             │
│             ▼                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │              TrqResourceBundleService  (abstract)                │        │
│  │                                                                  │        │
│  │  fetchResourceBundle(bundleName, locale) ──► Observable<Map>     │        │
│  │                                                                  │        │
│  │  Implemented by each app:                                        │        │
│  │  ┌────────────────────────────────────────────────────────┐      │        │
│  │  │  e.g. PlayResourceBundleService                        │      │        │
│  │  │  • HTTP GET assets/resource-bundles/{name}/{name}.json │      │        │
│  │  │  • flattens to { "BUNDLE_KEY": "translated text" }     │      │        │
│  │  └────────────────────────────────────────────────────────┘      │        │
│  └──────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONSUMING TRANSLATIONS                               │
│                                                                             │
│  Components / Templates can use any of these 3 approaches:                  │
│                                                                             │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │  1. DIRECTIVE        │  │  2. PIPE              │  │  3. SERVICE       │  │
│  │  (preferred)         │  │  (for attributes)     │  │  (in TypeScript)  │  │
│  │                      │  │                       │  │                   │  │
│  │  <span               │  │  {{ 'KEY'             │  │  translationSvc   │  │
│  │   [trqTranslate]=    │  │    | trqTranslate     │  │   .translate(     │  │
│  │     "'KEY'"          │  │    : 'BUNDLE'          │  │     'KEY',        │  │
│  │   [trqTranslate      │  │    : params }}         │  │     'BUNDLE',     │  │
│  │     Bundle]=          │  │                       │  │     params)       │  │
│  │     "'BUNDLE'"       │  │  ⚠ impure pipe,       │  │                   │  │
│  │   [trqTranslate      │  │    deprecated          │  │                   │  │
│  │     Params]=params>  │  │                       │  │                   │  │
│  │  </span>             │  │                       │  │                   │  │
│  └─────────┬───────────┘  └──────────┬────────────┘  └────────┬──────────┘  │
│            │                         │                         │             │
│            └─────────────┬───────────┘                         │             │
│                          │                                     │             │
│                          ▼                                     │             │
│               ┌──────────────────────────┐                     │             │
│               │  TrqTranslationService   │◄────────────────────┘             │
│               │                          │                                   │
│               │  translate(key, bundle,  │                                   │
│               │           params)        │                                   │
│               │                          │                                   │
│               │  key format:             │                                   │
│               │  "BUNDLE_RESOURCECODE"   │                                   │
│               │                          │                                   │
│               │  params: {{param1}}      │                                   │
│               └──────────┬───────────────┘                                   │
│                          │                                                   │
│                          ▼                                                   │
│               ┌──────────────────────────┐                                   │
│               │  @ngx-translate/core     │                                   │
│               │  TranslateService        │                                   │
│               │                          │                                   │
│               │  instant(key, params)    │                                   │
│               │  ──► returns translated  │                                   │
│               │      string              │                                   │
│               └──────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULE REGISTRATION                                 │
│                                                                             │
│  Root (AppModule):                                                          │
│  ┌───────────────────────────────────────────────────────────────┐          │
│  │ TrqI18nModule.forRoot(['COMMON','ADMIN'], MyBundleService)    │          │
│  │                                                               │          │
│  │ Registers: LocaleService, TranslationService, DirectionSvc,  │          │
│  │            LocaleInitializer, ResourceBundleLoader,           │          │
│  │            CommonStringsService                               │          │
│  └───────────────────────────────────────────────────────────────┘          │
│                                                                             │
│  Feature (Lazy modules):                                                    │
│  ┌───────────────────────────────────────────────────────────────┐          │
│  │ TrqI18nModule.forChild(['FEATURE_BUNDLE'])                    │          │
│  │                                                               │          │
│  │ Registers: additional bundle names + TranslateGuard           │          │
│  └───────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Summary (Interview Talking Points)

### What is it?
A **runtime i18n system** built on `@ngx-translate/core`. One build serves all locales — no per-language builds needed.

### How does it work?
1. **App starts** → `TrqLocaleInitializerService` reads the default locale from config and activates it.
2. **Locale activated** → `TrqLocaleService` normalizes the locale, sets the HTTP `Accept-Language` header, and triggers bundle loading.
3. **Bundles loaded** → `TrqTranslateResourceBundleLoader` calls the app's `TrqResourceBundleService` implementation for each registered bundle, then merges them into a flat key-value map (`BUNDLE_KEY → translated text`).
4. **Templates render** → Components use the `trqTranslate` directive, pipe, or `TrqTranslationService` to look up translated strings.
5. **RTL handled** → `TrqLocaleDirectionService` detects RTL locales and sets `dir` on `<html>`.

### Key Design Choices
| Decision | Why |
|---|---|
| Runtime translations | Translations may come from an API, not available at build time |
| Wraps ngx-translate | Decouples app code from the 3rd-party library — swappable later |
| Abstract `ResourceBundleService` | Each app decides where translations come from (API, static JSON, etc.) |
| Bundle namespacing (`BUNDLE_KEY`) | Prevents key collisions across modules |
| Directive over pipe | Pipe is impure (runs every change detection cycle); directive is more efficient |

### Resource Bundle JSON Format
```json
{
  "id": "common",
  "resources": [
    {
      "resourceId": "SAVE",
      "resourceValues": {
        "en": "Save",
        "fr": "Sauvegarder",
        "ar": "حفظ"
      }
    }
  ]
}
```

### Config Keys
| Key | Purpose |
|---|---|
| `trq.i18n.locales.default` | Startup locale (default: `en`) |
| `trq.i18n.locales.fallback` | Fallback when a key is missing |
| `trq.i18n.locales.ietf` | `true` = `en-US` format, `false` = `en_US` |
| `trq.i18n.bundles.default` | Default bundle when none specified in pipe/directive |

### RTL-Supported Locales
`ar` (Arabic), `fa` (Farsi), `iw`/`he` (Hebrew), `yi` (Yiddish), `ur` (Urdu)
