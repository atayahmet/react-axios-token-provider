# Release Notes:

## Changes for v1.0.0-rc.2:

- Docs improvement.
- The tokens added to local state and prevented component rerender with `shouldComponentUpdate` hook.
- Added csrf support.

## Changes for v1.0.0-rc.3:

- Made csrf header name changable.
- Made authorization header name changable.
- Made authorization header value prefix changable.
- Path variants merge has become more practical.

## Changes for v1.0.0-rc.4:

- Docs improvement.
- Changed package description.
- Added condition that checking the existence of instance.

## Changes for v1.0.0-rc.5:

- Fixed wrong store key.
- Added fallback to request interceptor when refresh key invalid (undefined or null)

## Changes for v1.0.0-rc.6:

- Added component unmount check for avoid memory leak error.

## Changes for v1.0.0-rc.7:

- Added component tests.
- Added props types for plain javascript environment.
- Fixed merge path variants function.
- Added `updater` prop for update provider config without render the component.
- Added async support to storage processes.

## Changes for v1.0.0-rc.8:

- Initial token and previously registered token added to the state according to the hierarchy.
- If csrf token value is undfined, changed as null.