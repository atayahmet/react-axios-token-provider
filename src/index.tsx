import get from "@util-funcs/object-get";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse
} from "axios";
import React, { Component } from "react";

export default class AxiosTokenProvider extends Component<
  IAxiosTokenProvider,
  any
> {
  private isRefreshTokenActive: boolean = false;
  private isCsrfTokenActive: boolean = false;
  private instance: AxiosInstance = axios;
  private storage: Storage = localStorage;
  private storeKeys: IStoreKey = {
    accessToken: "access_token",
    csrfToken: "csrf_token",
    refreshToken: "refresh_token",
  };
  private pathVariants: IPathVariants = {
    accessTokens: ["headers.x-access-token", "data.access_token"],
    csrfTokens: ["headers.x-csrf-token"],
    refreshTokens: ["headers.x-refresh-token", "data.refresh_token"],
  };

  constructor(props: IAxiosTokenProvider) {
    super(props);
    this.initialize();
  }

  public shouldComponentUpdate() {
    return false;
  }

  public componentDidMount() {
    const {
      initialAccessToken,
      initialRefreshToken,
      initialCsrfToken
    } = this.props;

    const {
      accessToken: accessTokenKey,
      refreshToken: refreshTokenKey,
      csrfToken: csrfTokenKey
    } = this.storeKeys;

    this.setState({
      [csrfTokenKey]: initialCsrfToken,
      [accessTokenKey]: initialAccessToken,
      [refreshTokenKey]: initialRefreshToken
    });
  }

  public render() {
    return <>{this.props.children}</>;
  }

  private initialize() {
    const {
      init,
      csrfToken = false,
      refreshToken = false,
      storage = localStorage,
      tokenPathVariants = {},
      instance = (this.instance || axios) as AxiosInstance
    } = this.props;

    this.storage = storage;
    this.instance = instance;
    this.isCsrfTokenActive = csrfToken;
    this.isRefreshTokenActive = refreshToken;
    this.pathVariants = this.mergePathVariants(tokenPathVariants);

    instance.interceptors.request.use(this.requestInterceptor);
    instance.interceptors.response.use(
      this.responseInterceptor,
      this.responseInterceptorError
    );

    if (init) {
      init(instance);
    }
  }

  private requestInterceptor = (config: AxiosRequestConfig) => {
    const key = this.isRefreshTokenActive
      ? this.storeKeys.refreshToken
      : this.storeKeys.accessToken;

    const token = this.getToken(key);
    config.headers["Authorization"] = `Bearer ${token}`;

    if (this.isCsrfTokenActive) {
      config.headers["X-CSRF-TOKEN"] = this.getToken(this.storeKeys.csrfToken);
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
    return {
      accessTokens: [
        ...new Set([
          ...this.pathVariants.accessTokens,
          ...(variants.accessTokens || [])
        ])
      ],
      refreshTokens: [
        ...new Set([
          ...this.pathVariants.refreshTokens,
          ...(variants.refreshTokens || [])
        ])
      ]
    };
  }

  private setToken(response: AxiosResponse) {
    const keys = Object.keys(this.pathVariants);
    let tokens = {};

    while (keys.length > 0) {
      const key = keys.shift() || "";
      const variants = get(key, this.pathVariants, []);

      for (const variant of variants) {
        const result = get(variant, response);
        const storageKey = this.storeKeys[key];

        if (result && storageKey) {
          tokens = { ...tokens, [storageKey]: result };
          this.storage.setItem(storageKey, result);
          break;
        }
      }
    }

    this.setState({ ...this.state, ...tokens });
  }

  private getToken(key: string) {
    return this.state[key] ? this.state[key] : this.storage.getItem(key);
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
  instance?: AxiosInstance;
  initialAccessToken?: string;
  initialRefreshToken?: string;
  initialCsrfToken?: string;
  tokenPathVariants?: IPathVariants;
  init?: (instance: AxiosInstance) => any;
  statusCallbacks?: Record<number | string, CallableFunction>;
}

interface IPathVariants {
  accessTokens?: string[];
  refreshTokens?: string[];
  csrfTokens?: string[];
}

interface IStoreKey extends Record<string, any> {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}
