# React Axios Token Provider

React Axios Token Provider package is a make easy what repetitive processes. For example handle access token or refresh token management process easly.

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

| name               | type          | default               | description                     |
|--------------------|---------------|-----------------------|---------------------------------|
| instance           | AxiosInstance | AxiosInstance         | An axios instance.              |
| init               | Function      | -                     | Initializer helper function.    |
| refreshToken       | Boolean       | false                 | Activation of refresh token.    |
| csrfToken          | Boolean       | false                 | Activation of csrf token.       |
| initialAccessToken | String        | -                     | Initial access token.           |
| initialRefreshToken| String        | -                     | Initial refresh token.          |
| initialCsrfToken   | String        | -                     | Initial csrf token.             |
| tokenPathVariants  | IPathVariants | [Default Path Variants](#default-path-variants) | The paths of all type tokens in response object.|
| statusCallbacks    | Object        | -                     |Specific events of status codes. |

## tokenPathVariants

You can define all token (access, refresh or csrf) paths to this prop.

**Example:**

```tsx
<AxiosTokenProvider
  tokenPathVariants={{
    accessTokens: ["headers.X-Access-Token", "data.tokens.access_token"],
    refreshTokens: ["headers.X-Refresh-Token", "data.tokens.refresh_token"]
  }}  
>
</AxiosTokenProvider>
```

## Default Path Variants

```js
{
  accessTokens: ["headers.x-access-token", "data.access_token"],
  refreshTokens: ["headers.x-refresh-token", "data.refresh_token"],
  csrfTokens: ["headers.x-csrf-token"]
}
```
