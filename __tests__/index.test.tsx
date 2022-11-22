import React from 'react';
import TestRenderer from 'react-test-renderer';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import Axios, { AxiosResponse } from 'axios';
import AxiosTokenProvider from './../src/index';
import MockAdapter from 'axios-mock-adapter';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, CSRF_TOKEN_KEY } from '../src/constants';

const ACCESS_TOKEN = 'dummy-access-token';
const REFRESH_TOKEN = 'dummy-refresh-token';
const CSRF_TOKEN = 'dummy-csrf-token';
const AUTH_HEADER_PREFIX = 'Bearer';

describe('Axios Token Provider component test', () => {
  let propsUpdater: any;
  let mock = new MockAdapter(Axios);
  let dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://test/',
  });

  const update = (updater: any) => (propsUpdater = updater);
  const defaultProps = {
    updater: update,
    instance: Axios,
    storage: dom.window.localStorage,
  };

  const tokens = {
    [ACCESS_TOKEN_KEY]: ACCESS_TOKEN,
    [REFRESH_TOKEN_KEY]: REFRESH_TOKEN,
    [CSRF_TOKEN_KEY]: CSRF_TOKEN,
  };
  dom.window.localStorage.setItem('tokens', JSON.stringify(tokens));
  const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />);
  const headerTokens = {
    'x-refresh-token': REFRESH_TOKEN,
    'x-csrf-token': CSRF_TOKEN,
  };

  const dummyData = {
    users: [],
    access_token: ACCESS_TOKEN,
  };

  beforeAll(() => {
    mock.onGet('/newPost').reply(200, {
      data: {
        auth: { tokens: { csrf_token: CSRF_TOKEN + '-new-post', refresh_token: REFRESH_TOKEN + '-new-post' } },
      },
    });
    mock.onPost('/newUser').reply(200, {}, headerTokens);
    mock.onPost('/newUser2').reply(201, {}, { ...headerTokens, 'x-xsrf-token': CSRF_TOKEN });
    mock.onGet('/newUser').reply(200, {}, headerTokens);
    mock.onGet('/login').reply(200, { access_token: ACCESS_TOKEN });
    mock.onGet('/users').reply(200, dummyData, {
      'x-refresh-token': REFRESH_TOKEN,
    });
    mock.onGet('/orders').reply(401);
  });

  it('initialize: -> initial tokens', async done => {
    const instance = component.getInstance() as any;
    const { state } = instance as AxiosTokenProvider;
    propsUpdater({ refreshToken: true, csrfToken: true });

    const { tokens } = state;
    expect(tokens['accessToken']).toEqual(ACCESS_TOKEN);
    expect(tokens['refreshToken']).toEqual(REFRESH_TOKEN);
    expect(tokens['csrfToken']).toEqual(CSRF_TOKEN);

    propsUpdater({ refreshToken: false, csrfToken: false });
    dom.window.localStorage.removeItem('tokens');
    instance.setState({
      tokens: {
        [CSRF_TOKEN_KEY]: undefined,
      },
    });
    done();
  });

  it('initialize: -> authHeaderPrefix', async done => {
    try {
      const response1 = (await Axios.get('/login')) as AxiosResponse;
      expect(response1.config.headers['Authorization']).toBeUndefined();
      const response2 = await Axios.get('/users');
      expect(response2.config.headers['Authorization']).toEqual(`${AUTH_HEADER_PREFIX} ${ACCESS_TOKEN}`);

      propsUpdater({ authHeaderPrefix: 'other' });
      const response3 = await Axios.get('/users');
      expect(response3.config.headers['Authorization']).toEqual(`other ${ACCESS_TOKEN}`);
      propsUpdater({ authHeaderPrefix: 'Bearer' });
      done();
    } catch (e) {
      done();
    }
  });

  it('initialize: -> authHeaderName', async done => {
    (await Axios.get('/login')) as AxiosResponse;
    const response1 = await Axios.get('/users');
    expect(response1.config.headers['Authorization']).toBeDefined();
    expect(response1.config.headers['X-Auth']).toBeUndefined();

    propsUpdater({ authHeaderName: 'X-Auth' });
    const response2 = await Axios.get('/users');
    expect(response2.config.headers['X-Auth']).toBeDefined();
    propsUpdater({ authHeaderName: 'Authorization' });
    done();
  });

  it('initialize: -> refreshToken', async done => {
    (await Axios.get('/login')) as AxiosResponse;
    const response1 = await Axios.get('/users');
    expect(response1.config.headers['Authorization']).toEqual(`Bearer ${ACCESS_TOKEN}`);
    propsUpdater({ refreshToken: true });
    const response2 = await Axios.get('/users');
    expect(response2.config.headers['Authorization']).toEqual(`Bearer ${REFRESH_TOKEN}`);

    const instance = component.getInstance() as any;

    instance.setState({
      tokens: {
        ...instance.state.tokens,
        refreshToken: null,
      },
    });

    setTimeout(async () => {
      const response = await Axios.get('/users');
      expect(response.config.headers['Authorization']).toEqual(`Bearer ${ACCESS_TOKEN}`);
      propsUpdater({ refreshToken: false });
      done();
    }, 10);
  });

  it('initialize: -> csrfToken', async done => {
    (await Axios.get('/login')) as AxiosResponse;
    const response2 = await Axios.post('/newUser');
    expect(response2.config.headers['Authorization']).toEqual(`Bearer ${ACCESS_TOKEN}`);

    propsUpdater({ csrfToken: true });
    await Axios.get('/newUser');
    const response3 = await Axios.post('/newUser');
    expect(response3.config.headers['X-Csrf-Token']).toEqual(CSRF_TOKEN);
    const response4 = await Axios.post('/newUser2');
    expect(response4.config.headers['X-Csrf-Token']).toEqual(CSRF_TOKEN);
    propsUpdater({ csrfToken: false });
    done();
  });

  it('initialize: -> csrfTokenHeaderName', async done => {
    (await Axios.get('/login')) as AxiosResponse;
    propsUpdater({ csrfToken: true });
    const response = await Axios.post('/newUser');
    expect(response.config.headers['X-Csrf-Token']).toEqual(CSRF_TOKEN);

    propsUpdater({ csrfToken: true, csrfTokenHeaderName: 'X-CSRFTOKEN' });
    const response2 = await Axios.post('/newUser');
    expect(response2.config.headers['X-CSRFTOKEN']).toEqual(CSRF_TOKEN);
    propsUpdater({ csrfToken: false, csrfTokenHeaderName: 'X-Csrf-Token' });
    done();
  });

  it('initialize: -> pathVariants', async done => {
    (await Axios.get('/login')) as AxiosResponse;
    propsUpdater({
      refreshToken: true,
      csrfToken: true,
      tokenPathVariants: {
        accessToken: ['data.data.auth.tokens.access_token'],
        csrfToken: ['data.data.auth.tokens.csrf_token'],
        refreshToken: ['data.data.auth.tokens.refresh_token'],
      },
    });

    const response = await Axios.get('/newPost');
    expect(response.config.headers['X-Csrf-Token']).toEqual(CSRF_TOKEN);
    expect(response.config.headers['Authorization']).toEqual(`Bearer ${REFRESH_TOKEN}`);

    const response2 = await Axios.get('/newPost');
    expect(response2.config.headers['X-Csrf-Token']).toEqual(CSRF_TOKEN + '-new-post');
    expect(response2.config.headers['Authorization']).toEqual(`Bearer ${REFRESH_TOKEN + '-new-post'}`);

    propsUpdater({
      refreshToken: false,
      csrfToken: false,
    });
    done();
  });

  it('initialize: -> statusCallbacks', async done => {
    const mock401 = jest.fn();
    try {
      (await Axios.get('/login')) as AxiosResponse;
      propsUpdater({
        statusCallbacks: {
          401: mock401,
        },
      });
      await Axios.get('/orders');
    } catch (e) {
      expect(mock401.mock.calls.length).toBeGreaterThanOrEqual(1);
      propsUpdater({ statusCallbacks: {} });
      done();
    }
  });

  describe('setTokens', () => {
    beforeEach(() => {
      dom.window.localStorage.removeItem('tokens');
    });

    it('should handle undefined value of the tokens variable', () => {
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;
      const config = component.setTokens(Axios.defaults, undefined);
      expect(config.headers['Authorization']).toBeUndefined();
      expect(config.headers['X-Csrf-Token']).toBeUndefined();
    });

    it('should set Authorization header with refresh token', () => {
      const component = TestRenderer.create(
        <AxiosTokenProvider refreshToken={true} {...defaultProps} />,
      ).getInstance() as any;
      const config = component.setTokens(Axios.defaults, {
        [REFRESH_TOKEN_KEY]: REFRESH_TOKEN,
      });

      expect(config.headers['Authorization']).toBeDefined();
    });

    it('should set Authorization header with access token', () => {
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;
      const config = component.setTokens(Axios.defaults, {
        [REFRESH_TOKEN_KEY]: REFRESH_TOKEN,
      });

      expect(config.headers['Authorization']).toBeDefined();
    });

    it('should set X-CSRF-Token header', () => {
      const component = TestRenderer.create(
        <AxiosTokenProvider csrfToken={true} {...defaultProps} />,
      ).getInstance() as any;
      const config = component.setTokens(Axios.defaults, {
        [CSRF_TOKEN_KEY]: CSRF_TOKEN,
      });

      expect(config.headers['X-Csrf-Token']).toBeDefined();
      expect(config.headers['X-Csrf-Token']).toEqual(CSRF_TOKEN);
    });

    it('should handle nullish values for tokens parameter', () => {
      const component = TestRenderer.create(
        <AxiosTokenProvider csrfToken={true} {...defaultProps} />,
      ).getInstance() as any;

      expect(() => component.setTokens(Axios.defaults, null)).not.toThrow();
    });
  });

  describe('getTokens', () => {
    const tokens = {
      csrfToken: 'csrftoken',
      accessToken: 'accesstoken',
      refreshToken: 'refreshtoken',
    };

    it('should return from the state if so', () => {
      const component = TestRenderer.create(
        <AxiosTokenProvider csrfToken={true} {...defaultProps} />,
      ).getInstance() as any;

      component.setState({
        tokens,
      });
      expect(component.getTokens()).toEqual(tokens);
    });

    it('should return from the storage if it is not in state and is in the storage', () => {
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;

      component.setState({
        tokens: undefined,
      });
      dom.window.localStorage.setItem('tokens', JSON.stringify(tokens));
      expect(component.getTokens()).toEqual(tokens);
    });
  });

  describe('runStatusCallbacks', () => {
    beforeAll(() => {
      dom.window.localStorage.removeItem('tokens');
    });

    it('should run the callback if it is in callback list', () => {
      const fakeCb201 = sinon.fake();
      const fakeCb200 = sinon.fake();

      sinon.fake();
      const component = TestRenderer.create(
        <AxiosTokenProvider statusCallbacks={{ 200: fakeCb200, 201: fakeCb201 }} {...defaultProps} />,
      ).getInstance() as any;

      component.runStatusCallbacks({ status: 201 });

      expect(fakeCb201.calledOnce).toEqual(true);
      expect(fakeCb200.notCalled).toEqual(true);
    });

    it('should run the callback if a function defined to the corresponding status code', () => {
      const component = TestRenderer.create(
        <AxiosTokenProvider statusCallbacks={{ 200: undefined as any }} {...defaultProps} />,
      ).getInstance() as any;

      component.runStatusCallbacks({ status: 200 });
    });
  });

  describe('setInitialTokens', () => {
    it('should set the all initilal tokens to the local state', () => {
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;

      expect(component.state.tokens.csrfToken).toBeUndefined();
      expect(component.state.tokens.refreshToken).toBeUndefined();
      expect(component.state.tokens.accessToken).toBeUndefined();

      component.setInitialTokens({
        initialCsrfToken: 'csrftok',
        initialRefreshToken: 'reftok',
        initialAccessToken: 'acctok',
      });

      expect(component.state.tokens.csrfToken).toEqual('csrftok');
      expect(component.state.tokens.refreshToken).toEqual('reftok');
      expect(component.state.tokens.accessToken).toEqual('acctok');
    });

    it('should set the all async initial tokens to the local state', async done => {
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;

      const getTokensMock = sinon.mock(component);
      getTokensMock.expects('getTokens').resolves({
        initialCsrfToken: 'csrftok',
        initialRefreshToken: 'reftok',
        initialAccessToken: 'acctok',
      });

      expect(component.state.tokens.csrfToken).toBeUndefined();
      expect(component.state.tokens.refreshToken).toBeUndefined();
      expect(component.state.tokens.accessToken).toBeUndefined();

      await component.setInitialTokens({
        initialCsrfToken: 'csrftok',
        initialRefreshToken: 'reftok',
        initialAccessToken: 'acctok',
      });

      expect(component.state.tokens.csrfToken).toEqual('csrftok');
      expect(component.state.tokens.refreshToken).toEqual('reftok');
      expect(component.state.tokens.accessToken).toEqual('acctok');

      getTokensMock.verify();
      getTokensMock.restore();
      done();
    });
  });

  describe('requestInterceptor', () => {
    it('should set tokens to the request config', () => {
      const tokens = {
        csrfToken: 'csrftoken',
        accessToken: 'accesstoken',
        refreshToken: 'refreshtoken',
      };
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;
      component.setState({
        tokens,
      });

      const axiosConfig1 = { headers: {} };
      const result = component.requestInterceptor(axiosConfig1);
      expect(result.headers.Authorization).toBeDefined();
      expect(result.headers.Authorization).toEqual('Bearer accesstoken');
      expect(result.headers['X-Csrf-Token']).toBeUndefined();

      component.initialize({ ...defaultProps, csrfToken: true });
      const axiosConfig2 = { headers: {} };
      const result2 = component.requestInterceptor(axiosConfig2);
      expect(result2.headers['X-Csrf-Token']).toBeDefined();
      expect(result2.headers['X-Csrf-Token']).toEqual('csrftoken');

      component.initialize({ ...defaultProps, refreshToken: true });
      const axiosConfig3 = { headers: {} };
      const result3 = component.requestInterceptor(axiosConfig3);
      expect(result3.headers.Authorization).toBeDefined();
      expect(result3.headers.Authorization).toEqual('Bearer refreshtoken');
    });

    it('should set async tokens to the request config', async () => {
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;

      const getTokensMock = sinon.mock(component);
      getTokensMock.expects('getTokens').resolves({
        csrfToken: 'csrftoken',
        accessToken: 'accesstoken',
        refreshToken: 'refreshtoken',
      });

      const axiosConfig = { headers: {} };
      const result = await component.requestInterceptor(axiosConfig);

      expect(result.headers.Authorization).toBeDefined();
      expect(result.headers.Authorization).toEqual('Bearer accesstoken');
    });
  });

  describe('responseInterceptor', () => {
    it('should add the tokens to the storage and run callbacks for status codes and set the tokens to the local state', () => {
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;

      const mock = sinon.mock(component);
      const cbCallerMock = mock.expects('runStatusCallbacks');
      const setStateMock = mock.expects('setState');

      const setItemFake = sinon.fake();
      sinon.replace(component, 'storage', {
        setItem: setItemFake,
      });

      const response = {
        headers: { 'x-access-token': 'new-accesstoken' },
      };
      component.responseInterceptor(response);

      expect(setItemFake.callCount).toEqual(1);
      expect(setStateMock.getCall(0).args[0].tokens.accessToken).toEqual('new-accesstoken');
      cbCallerMock.verify();
      setStateMock.verify();
      sinon.verifyAndRestore();
    });
  });

  describe('responseInterceptorError', () => {
    it('should run the callbacks of status if there is response object in error object', async () => {
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;
      const mock = sinon.mock(component);
      const cbCaller = mock.expects('runStatusCallbacks');
      const error = { response: {} };
      expect(component.responseInterceptorError(error)).rejects.toEqual(error);
      cbCaller.verify();
    });
  });

  describe('componentWillUnmount', () => {
    it('should reject handlers from interceptors when component is unmount', () => {
      const component = TestRenderer.create(<AxiosTokenProvider {...defaultProps} />).getInstance() as any;

      const mockReq = sinon.mock(component.instance.interceptors.request);
      const reqEject = mockReq.expects('eject');

      const mockRes = sinon.mock(component.instance.interceptors.response);
      const resEject = mockRes.expects('eject');

      component.componentWillUnmount();

      reqEject.verify();
      resEject.verify();
    });
  });
});
