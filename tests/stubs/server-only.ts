// `server-only` throws on import outside a Server Component, which is exactly
// what we want in the app and exactly what breaks a Node test runner. Vitest
// aliases the package to this no-op so server modules can be unit tested.
export {};
