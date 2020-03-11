import get from '@util-funcs/object-get';
import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import React, { Component } from 'react';

export default class AxiosTokenProvider extends Component<IAxiosTokenProvider, any> {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly CSRF_TOKEN_KEY = 'csrfToken';
  private isRefreshTokenActive: boolean = false;
  private isCsrfTokenActive: boolean = false;
  private instance: AxiosInstance | undefined;
  private storage: Storage = localStorage;
  private csrfTokenHeaderName: string = 'X-Csrf-Token';
  private authHeaderName: string = 'Authorization';
  private authHeaderPrefix: string = 'Bearer';
  private isUnmounted: boolean = false;
  private storeKeys: IStoreKey = {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
  };
  private pathVariants: IPathVariants = {
    accessToken: ['headers.x-access-token', 'data.access_token'],
    csrfToken: ['headers.x-csrf-token', 'headers.x-xsrf-token'],
    refreshToken: ['headers.x-refresh-token', 'data.refresh_token'],
  };

  constructor(props: IAxiosTokenProvider) {
    super(props);
    this.initialize();
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentDidMount() {
    this.isUnmounted = false;

    const { initialAccessToken, initialRefreshToken, initialCsrfToken } = this.props;

    this.setState({
      [this.CSRF_TOKEN_KEY]: initialCsrfToken,
      [this.ACCESS_TOKEN_KEY]: initialAccessToken,
      [this.REFRESH_TOKEN_KEY]: initialRefreshToken,
    });
  }

  public componentWillUnmount() {
    this.isUnmounted = true;
  }

  public render = () => <>{this.props.children}</>;

  private initialize() {
    const {
      init,
      instance,
      csrfToken = false,
      refreshToken = false,
      storage = localStorage,
      tokenPathVariants = {},
      authHeaderName = this.authHeaderName,
      authHeaderPrefix = this.authHeaderPrefix,
      csrfTokenHeaderName = this.csrfTokenHeaderName,
    } = this.props;

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
    this.pathVariants = this.mergePathVariants(tokenPathVariants);

    this.instance.interceptors.request.use(this.requestInterceptor);
    this.instance.interceptors.response.use(this.responseInterceptor, this.responseInterceptorError);

    if (init) {
      init(this.instance);
    }
  }

  private requestInterceptor = (config: AxiosRequestConfig) => {
    const { [this.REFRESH_TOKEN_KEY]: refreshToken } = this.state;
    const key = this.isRefreshTokenActive && !!refreshToken ? this.REFRESH_TOKEN_KEY : this.ACCESS_TOKEN_KEY;

    // set authorization header
    const token = this.getToken(key);
    config.headers[this.authHeaderName] = `${this.authHeaderPrefix} ${token}`;

    // set csrf header
    if (this.isCsrfTokenActive) {
      config.headers[this.csrfTokenHeaderName] = this.getToken(this.CSRF_TOKEN_KEY);
    }

    return config;
  };

  private responseInterceptorError = (error: AxiosError) => {
    const { response } = error;

    if (response) {
      this.runStatusCallbacks(response);
    }

    return Promise.reject(error);
  };

  private responseInterceptor = (response: AxiosResponse) => {
    this.setToken(response);
    this.runStatusCallbacks(response);
    return response;
  };

  private mergePathVariants(variants: IPathVariants): IPathVariants {
    const keys = Object.keys(variants) as Keys[];
    let paths = {};

    while (keys.length > 0) {
      const key = keys.shift();

      if (!key || !(key in this.pathVariants)) {
        continue;
      }

      const prevPaths = this.pathVariants[key] || [];
      const customPaths = variants[key] || [];
      const uniquePaths = new Set([...prevPaths, ...customPaths]);
      paths = { ...paths, [key]: [...uniquePaths] };
    }

    return paths;
  }

  private setToken(response: AxiosResponse) {
    const keys = Object.keys(this.pathVariants);
    let tokens = {};

    while (keys.length > 0) {
      const key = keys.shift() || '';
      const variants = get(key, this.pathVariants, []);

      for (const variant of variants) {
        const result = get(variant, response);
        const storageKey = this.storeKeys[key];

        if (result && storageKey) {
          tokens = { ...tokens, [key]: result };
          this.storage.setItem(storageKey, result);
          break;
        }
      }
    }

    if (!this.isUnmounted) {
      this.setState({ ...this.state, ...tokens });
    }
  }

  private getToken(key: string) {
    return this.state[key] ? this.state[key] : this.storage.getItem(this.storeKeys[key]);
  }

  private runStatusCallbacks(response: AxiosResponse) {
    const { statusCallbacks = [] } = this.props;
    const cb = statusCallbacks[response.status];

    if (cb) {
      cb(response);
    }
  }
}

interface IAxiosTokenProvider extends AxiosRequestConfig {
  storage?: Storage;
  refreshToken?: boolean;
  csrfToken?: boolean;
  instance: AxiosInstance;
  initialAccessToken?: string;
  initialRefreshToken?: string;
  initialCsrfToken?: string;
  csrfTokenHeaderName?: string;
  authHeaderName?: string;
  authHeaderPrefix?: string;
  tokenPathVariants?: IPathVariants;
  init?: (instance: AxiosInstance) => any;
  statusCallbacks?: Record<number | string, CallableFunction>;
}

interface IPathVariants {
  accessToken?: string[];
  refreshToken?: string[];
  csrfToken?: string[];
}

interface IStoreKey extends Record<string, any> {
  accessToken: string;
  refreshToken: string;
}

type Keys = 'accessToken' | 'refreshToken' | 'csrfToken';
