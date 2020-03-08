# React Axios Token Provider

React Axios Token Provider package is a make easy what repetitive processes. For example handle access token or refresh token management easly.

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

| name               | type          | default               |
|--------------------|---------------|-----------------------|
| instance           | AxiosInstance | AxiosInstance         |
| init               | Function      | -                     |
| refreshToken       | Boolean       | false                 |
| csrfToken          | Boolean       | false                 |
| initialAccessToken | String        | -                     |
| initialRefreshToken| String        | -                     |
| initialCsrfToken   | String        | -                     |
| tokenPathVariants  | IPathVariants | Default Path Variants |
| statusCallbacks    | Object        | -
