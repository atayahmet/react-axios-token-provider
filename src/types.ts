import { AxiosInstance } from 'axios';

export interface IAxiosTokenProvider {
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
  updater?: (func: any) => any;
  init?: (instance: AxiosInstance) => any;
  statusCallbacks?: Record<number | string, CallableFunction>;
}

export interface IPathVariants {
  accessToken?: string[];
  refreshToken?: string[];
  csrfToken?: string[];
}

export interface IStoreKey extends Record<string, any> {
  accessToken: string;
  refreshToken: string;
}

export type Keys = 'accessToken' | 'refreshToken' | 'csrfToken';
