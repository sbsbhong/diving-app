# Home Location Conditions Design

## Goal

Add a provider-neutral Home landing interface for current local context: local time, city name, air temperature, and water temperature when the current location is coastal.

The first implementation should build the interface, state model, and UI. Real API integration is deferred until the user chooses and supplies the provider integration.

## Provider Recommendation

Use Open-Meteo as the default first provider candidate:

- Open-Meteo Weather API can provide weather conditions by latitude/longitude.
- Open-Meteo Marine Weather API can provide marine conditions including water-temperature style data for coastal coordinates.
- It is suitable for a low-friction PoC because it can be evaluated without early account setup.

Keep the interface open to alternatives:

- Stormglass: strong marine-weather breadth, including water temperature, waves, currents, salinity, and related marine values, but with tighter free-tier/commercial constraints.
- Meteomatics: broad enterprise weather and marine parameter coverage, likely better for later productization than first PoC.
- NOAA NWS plus NOAA CO-OPS: useful for United States data and station-based water temperature, but not a global default.

## Scope

In scope:

- Add a `HomeConditionsSnapshot` type and provider interface.
- Add a mock/static provider for UI development.
- Add Home UI for local time, city name, air temperature, optional water temperature, data freshness, and loading/unavailable states.
- Keep API adapter files isolated so the user can later add real network code.
- Avoid dive-safety recommendations based on weather or water temperature.

Out of scope:

- Real API calls.
- API keys or secrets.
- Background location tracking.
- Dive suitability scoring.
- Weather alerts, marine warnings, no-fly, tide, current, wave, or route planning.

## Data Model

Suggested mobile type:

```ts
export type HomeConditionsSnapshot = {
  status: 'idle' | 'loading' | 'ready' | 'permissionDenied' | 'unavailable' | 'error';
  localTime?: number;
  cityName?: string;
  latitude?: number;
  longitude?: number;
  airTemperatureCelsius?: number;
  waterTemperatureCelsius?: number;
  isCoastal?: boolean;
  source?: 'mock' | 'openMeteo' | 'stormglass' | 'meteomatics' | 'noaa';
  updatedAt?: number;
  errorMessage?: string;
};
```

Provider interface:

```ts
export type HomeConditionsProvider = {
  getCurrentConditions(input: {
    latitude?: number;
    longitude?: number;
    locale?: string;
  }): Promise<HomeConditionsSnapshot>;
};
```

The interface accepts coordinates but should not require location permission for UI rendering. When coordinates are absent, the provider returns `idle`, `permissionDenied`, or `unavailable`.

## Home UX

Place a compact conditions band near the top of Home before the latest log card:

- Primary line: city name and local time.
- Metric tiles: air temperature, optional water temperature.
- Status line: source and last updated time.

If `isCoastal` is false or `waterTemperatureCelsius` is missing:

- Hide the water temperature tile, or show a small neutral "Water temp unavailable" line.
- Do not imply the location is unsuitable for diving.

If permission/API state is unavailable:

- Show a neutral placeholder: "Location conditions unavailable".
- Keep Logbook and Planning actions visible.
- Do not block the app.

## Testing

- Home renders ready snapshot with city, local time, air temperature, and water temperature.
- Home hides or neutralizes water temperature when `isCoastal` is false.
- Home renders permission denied/unavailable state without blocking Logbook and Planning actions.
- Provider interface can be mocked in tests.
- Run `yarn mobile:typecheck`.

## Sources

- User-approved direction on 2026-06-26.
- `apps/mobile/src/screens/home/screen.tsx`
- Open-Meteo Weather API documentation: https://open-meteo.com/en/docs
- Open-Meteo Marine Weather API documentation: https://open-meteo.com/en/docs/marine-weather-api
- Stormglass marine-weather product page: https://stormglass.io/marine-weather/
- Meteomatics available parameters: https://www.meteomatics.com/en/api/available-parameters/
- NOAA CO-OPS Data Retrieval API: https://api.tidesandcurrents.noaa.gov/api/prod/
