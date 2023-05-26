import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  ACCESS_TOKEN_KEY,
  CSRF_TOKEN_KEY,
  DEFAULT_ACCESS_TOKEN_PATHS,
  DEFAULT_CSRF_TOKEN_PATHS,
  DEFAULT_REFRESH_TOKEN,
  REFRESH_TOKEN_KEY,
} from './constants';
import { IAxiosTokenProvider, IPathVariants, IStoreKey } from './types';
import { mergePathVariants, prepareTokens } from './utils';

export default class AxiosTokenProvider extends Component<IAxiosTokenProvider, any> {
  public static propTypes: any;
  private reqIntVal?: number | null;
  private resIntVal?: number | null;
  private isRefreshTokenActive: boolean = false;
  private isCsrfTokenActive: boolean = false;
  private instance: AxiosInstance | undefined;
  private storage: Storage = localStorage;
  private callbacks: Record<number, CallableFunction> = {};
  private csrfTokenHeaderName: string = 'X-Csrf-Token';
  private authHeaderName: string = 'Authorization';
  private authHeaderPrefix: string = 'Bearer';
  private pathVariants: IPathVariants = {
    accessToken: DEFAULT_ACCESS_TOKEN_PATHS,
    csrfToken: DEFAULT_CSRF_TOKEN_PATHS,
    refreshToken: DEFAULT_REFRESH_TOKEN,
  };
  private isCompMounted: boolean = false;

  constructor(props: IAxiosTokenProvider) {
    super(props);
    this.initialize(props);
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentDidMount() {
    this.isCompMounted = true;
    this.setInitialTokens(this.props);
  }

  public componentWillUnmount() {
    if (this.reqIntVal) {
      this.instance?.interceptors.request.eject(this.reqIntVal);
      this.reqIntVal = null;
    }
    if (this.resIntVal) {
      this.instance?.interceptors.response.eject(this.resIntVal);
      this.resIntVal = null;
    }
  }

  public render = () => <>{this.props.children}</>;

  public updateProps = ({ updater, ...props }: IAxiosTokenProvider) => {
    this.initialize({ ...this.props, ...props });
  };

  private initialize(props: IAxiosTokenProvider) {
    const {
      init,
      instance,
      updater,
      csrfToken = false,
      refreshToken = false,
      statusCallbacks = {},
      storage = localStorage,
      tokenPathVariants = {},
      authHeaderName = this.authHeaderName,
      authHeaderPrefix = this.authHeaderPrefix,
      csrfTokenHeaderName = this.csrfTokenHeaderName,
    } = props;

    if (!instance) {
      return;
    }

    this.storage = storage;
    this.instance = instance as AxiosInstance;
    this.isCsrfTokenActive = csrfToken;
    this.isRefreshTokenActive = refreshToken;
    this.authHeaderName = authHeaderName;
    this.authHeaderPrefix = authHeaderPrefix;
    this.csrfTokenHeaderName = csrfTokenHeaderName;
    this.pathVariants = mergePathVariants(this.pathVariants, tokenPathVariants);
    this.callbacks = statusCallbacks;
    this.instance.defaults.headers['X-Requested-With'] = 'XMLHttpRequest';

    this.reqIntVal = this.instance.interceptors.request.use(this.requestInterceptor);
    this.resIntVal = this.instance.interceptors.response.use(this.responseInterceptor, this.responseInterceptorError);

    if (updater) {
      updater(this.updateProps);
    }

    if (init) {
      init(this.instance);
    }
  }

  private requestInterceptor = (config: AxiosRequestConfig) => {
    const tokens = this.getTokens();
    let newConfig: AxiosRequestConfig;

    if (tokens instanceof Promise) {
      return tokens.then(allTokens => {
        newConfig = this.setTokens(config, allTokens);
        return Promise.resolve(newConfig);
      });
    }

    newConfig = this.setTokens(config, tokens);

    return newConfig;
  };

  private setStateSafely = (state: any) => {
    if (this.isCompMounted) {
      this.setState(state);
    } else {
      this.state = { ...this.state, ...state };
    }
  };

  private responseInterceptor = (response: AxiosResponse) => {
    const currentTokens = this.getTokens() || {};
    const newTokens = prepareTokens(this.pathVariants, response);
    const tokens = { ...currentTokens, ...newTokens };

    this.storage.setItem('tokens', JSON.stringify(tokens));
    this.runStatusCallbacks(response);
    this.setStateSafely({ ...this.state, tokens });

    return response;
  };

  private responseInterceptorError = (error: AxiosError) => {
    const { response } = error;

    if (response) {
      this.runStatusCallbacks(response);
    }

    return Promise.reject(error);
  };

  private setInitialTokens = (props: IAxiosTokenProvider) => {
    const { initialAccessToken, initialRefreshToken, initialCsrfToken } = props;
    const tokens = this.getTokens() || {};
    const stateUpdater = (storedTokens: Record<string, string>) =>
      this.setStateSafely({
        tokens: {
          [CSRF_TOKEN_KEY]: initialCsrfToken || storedTokens[CSRF_TOKEN_KEY],
          [ACCESS_TOKEN_KEY]: initialAccessToken || storedTokens[ACCESS_TOKEN_KEY],
          [REFRESH_TOKEN_KEY]: initialRefreshToken || storedTokens[REFRESH_TOKEN_KEY],
        },
      });
    if (tokens instanceof Promise) {
      return tokens.then(allTokens => stateUpdater(allTokens));
    }

    stateUpdater(tokens);
  };

  private setTokens = (config: AxiosRequestConfig, tokens: IStoreKey) => {
    tokens = tokens || {};
    const { [REFRESH_TOKEN_KEY]: refreshToken } = tokens;
    const key = this.isRefreshTokenActive && !!refreshToken ? REFRESH_TOKEN_KEY : ACCESS_TOKEN_KEY;

    // set authorization header
    if (tokens[key]) {
      config.headers[this.authHeaderName] = `${this.authHeaderPrefix} ${tokens[key]}`;
    }

    // set csrf header
    if (this.isCsrfTokenActive) {
      const csrfToken = tokens[CSRF_TOKEN_KEY];
      config.headers[this.csrfTokenHeaderName] = csrfToken || null;
    }

    return config;
  };

  private getTokens() {
    const { tokens } = this.state || {};

    if (!!tokens && Object.keys(tokens).length > 0) {
      return tokens;
    }

    const storedTokens = this.storage.getItem('tokens') as any;
    return typeof storedTokens === 'string' ? JSON.parse(storedTokens) : storedTokens;
  }

  private runStatusCallbacks(response: AxiosResponse) {
    const cb = this.callbacks[response.status];

    if (cb) {
      cb(response);
    }
  }
}

AxiosTokenProvider.propTypes = {
  authHeaderName: PropTypes.string,
  authHeaderPrefix: PropTypes.string,
  csrfToken: PropTypes.bool,
  csrfTokenHeaderName: PropTypes.string,
  init: PropTypes.func,
  instance: PropTypes.func.isRequired,
  refreshToken: PropTypes.bool,
  statusCallbacks: PropTypes.object,
  storage: PropTypes.shape({
    getItem: PropTypes.func.isRequired,
    setItem: PropTypes.func.isRequired,
  }),
  tokenPathVariants: PropTypes.shape({
    accessToken: PropTypes.arrayOf(PropTypes.string),
    csrfToken: PropTypes.arrayOf(PropTypes.string),
    refreshToken: PropTypes.arrayOf(PropTypes.string),
  }),
  updater: PropTypes.func,
};
