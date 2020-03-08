# React Axios Token Provider

React Axios Token Provider package is a make easy what repetitive processes. For example handle access token or refresh token management process easly.

# Installation

Use the package manager **yarn** or **npm** to install `react-axios-token-provider`

```sh
$ npm i @atayahmet/react-axios-token-provider --save
```

```sh
$ yarn add @atayahmet/react-axios-token-provider
```


# Usage

```jsx
import AxiosTokenProvider from '@atayahmet/react-axios-token-provider';
import axios from 'axios';

function App() {
  return (
    <AxiosTokenProvider instance={axios}>
      <View>
        <Text>Hello World!</Text>
      </View>
    </AxiosTokenProvider>
  );
}
```

# Props

| name               | type          | default               | description                     |
|--------------------|---------------|-----------------------|---------------------------------|
| instance           | AxiosInstance | AxiosInstance         | An axios instance.              |
| init               | Function      | -                     | Initializer helper function.    |
| refreshToken       | Boolean       | false                 | Activation of refresh token.    |
| csrfToken          | Boolean       | false                 | Activation of csrf token.       |
| initialAccessToken | String        | -                     | Initial access token.           |
| initialRefreshToken| String        | -                     | Initial refresh token.          |
| initialCsrfToken   | String        | -                     | Initial csrf token.             |
| tokenPathVariants  | IPathVariants | Default Path Variants | The paths of all type tokens in response object.|
| statusCallbacks    | Object        | -                     |Specific events of status codes. |
