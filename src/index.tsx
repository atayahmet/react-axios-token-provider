import get from '@util-funcs/object-get';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import React, { Component } from 'react';

export default class AxiosTokenProvider extends Component<IAxiosTokenProvider, any> {
  private refreshToken: boolean = false;
  private instance: AxiosInstance = axios;
  private storage: Storage = localStorage;
  private storeKeys: Record<string, string> = {
    accessTokens: 'access_token',
    refreshTokens: 'refresh_token',
  };
  private pathVariants: IIPathVariants = {
    accessTokens: ['headers.x-access-token', 'data.access_token'],
    refreshTokens: ['headers.x-refresh-token', 'data.refresh_token'],
  };

  constructor(props: IAxiosTokenProvider) {
    super(props);
    this.initialize();
  }

  public render() {
    return <>{this.props.children}</>;
  }

  private initialize() {
    const {
      init,
      refreshToken = false,
      storage = localStorage,
      tokenPathVariants = {},
      instance = (this.instance || axios) as AxiosInstance,
    } = this.props;

    this.storage = storage;
    this.instance = instance;
    this.refreshToken = refreshToken;
    this.pathVariants = this.mergeVariantPaths(tokenPathVariants);

    instance.interceptors.request.use(this.requestInterceptor);
    instance.interceptors.response.use(this.responseInterceptor, this.responseInterceptorError);
    
    if (init) {
      init(instance);
    }
  }

  private requestInterceptor = (config: AxiosRequestConfig) => {
    const key = this.refreshToken ? this.storeKeys.refreshTokens : this.storeKeys.accessTokens;
    const token = this.storage.getItem(key);
    const accessToken = this.storage.getItem(this.storeKeys.accessTokens);
    config.headers['Authorization'] = `Bearer ${token || accessToken}`;
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

  private mergeVariantPaths(variants: IIPathVariants): IIPathVariants {
    return {
      accessTokens: [...new Set([...this.pathVariants.accessTokens, ...(variants.accessTokens || [])])],
      refreshTokens: [...new Set([...this.pathVariants.refreshTokens, ...(variants.refreshTokens || [])])],
    };
  }

  private setToken(response: AxiosResponse) {
    const keys = Object.keys(this.pathVariants);

    while (keys.length > 0) {
      const key = keys.shift() || '';
      const variants = get(key, this.pathVariants, []);

      for (const variant of variants) {
        const result = get(variant, response);
        if (result) {
          this.storage.setItem(this.storeKeys[key], result);
          break;
        }
      }
    }
  }

  private runStatusCallbacks(response: AxiosResponse) {
    const { statusCallbacks = [] } = this.props;
    const cb = statusCallbacks[response.status];
    
    if(cb) {
      cb(response);
    }
  }
}

interface IAxiosTokenProvider extends AxiosRequestConfig {
  baseURL?: string;
  storage?: Storage;
  refreshToken?: boolean;
  instance?: AxiosInstance;
  initialAccessToken?: string;
  initialRefreshToken?: string;
  tokenPathVariants?: IIPathVariants;
  init?: (instance: AxiosInstance) => any;
  statusCallbacks?: Record<number | string, CallableFunction>;
}

interface IIPathVariants {
  accessTokens?: string[];
  refreshTokens?: string[];
}
