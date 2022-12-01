[![Build Status](https://travis-ci.org/atayahmet/react-axios-token-provider.svg?branch=master)](https://travis-ci.org/atayahmet/react-axios-token-provider)

# React Axios Token Provider

React Axios Token Provider package is a make easy what repetitive processes. For example handle access token or refresh token management process easly.

## Why

It can be preferred to reduce repetitive practices for authentication operations in projects.

## Features

- Access token management
- Refresh token management
- Csrf/Xsrf token management

## Installation

Use the package manager **yarn** or **npm** to install `react-axios-token-provider`

```sh
$ npm i @atayahmet/react-axios-token-provider --save
```

```sh
$ yarn add @atayahmet/react-axios-token-provider
```

## Basic Usage

```jsx
import AxiosTokenProvider from '@atayahmet/react-axios-token-provider';
import axios from 'axios';

function App() {
  return (
    <AxiosTokenProvider instance={axios}>
      <div>
        <h1>Hello World!</h1>
      </div>
    </AxiosTokenProvider>
  );
}
```

## Props

| name                | type          | default                                         | description                                      |
| ------------------- | ------------- | ----------------------------------------------- | ------------------------------------------------ |
| instance            | AxiosInstance | AxiosInstance                                   | An axios instance.                               |
| init                | Function      | -                                               | Initializer helper function.                     |
| refreshToken        | Boolean       | false                                           | Activation of refresh token.                     |
| csrfToken           | Boolean       | false                                           | Activation of csrf token.                        |
| initialAccessToken  | String        | -                                               | Initial access token.                            |
| initialRefreshToken | String        | -                                               | Initial refresh token.                           |
| initialCsrfToken    | String        | -                                               | Initial csrf token.                              |
| tokenPathVariants   | IPathVariants | [Default Path Variants](#default-path-variants) | The paths of all type tokens in response object. |
| statusCallbacks     | Object        | -                                               | Specific events of status codes.                 |

## instance

You need to define your axios instance you want to manage. If no instance is defined, no action will be taken. A log is written to the console at the warning level.

**Example:**

```tsx
import axios from 'axios';

<AxiosTokenProvider instance={axios}>
  <App />
</AxiosTokenProvider>;
```

## init

The init prop is a inilizer function for provide extra config to developers.

**Example:**

```js
function initializer(instance) {
  instance.baseURL = 'https://reqres.in/api';
}
```

```tsx
<AxiosTokenProvider init={initializer} instance={axios}>
  <App />
</AxiosTokenProvider>
```

## tokenPathVariants

You can define all token (access, refresh or csrf) paths to this prop.

**Example:**

```tsx
<AxiosTokenProvider
  tokenPathVariants={{
    accessToken: ['headers.X-Access-Token', 'data.tokens.access_token'],
    refreshToken: ['headers.X-Refresh-Token', 'data.tokens.refresh_token'],
  }}
></AxiosTokenProvider>
```

## Default Path Variants

```js
{
  accessToken: ['headers.x-access-token', 'data.access_token'],
  csrfToken: ['headers.x-csrf-token', 'headers.x-xsrf-token'],
  refreshToken: ['headers.x-refresh-token', 'data.refresh_token'],
}
```

## statusCallbacks

You can define specific callbacks to response status codes.

**Example:**

```js
function unauthorized(response) {
  location.href = '/login';
}

function forbidden(response) {
  // do something
}
```

```tsx
<AxiosTokenProvider
  statusCallbacks={{
    401: unauthorized,
    403: forbidden,
  }}
></AxiosTokenProvider>
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
