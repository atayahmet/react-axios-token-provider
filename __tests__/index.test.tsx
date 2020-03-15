import React from 'react';
import TestRenderer from 'react-test-renderer';
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
    const { state: {tokens} } = instance as any;
    propsUpdater({ refreshToken: true, csrfToken: true });

    expect(tokens['accessToken']).toEqual(ACCESS_TOKEN);
    expect(tokens['refreshToken']).toEqual(REFRESH_TOKEN);
    expect(tokens['csrfToken']).toEqual(CSRF_TOKEN);

    propsUpdater({ refreshToken: false, csrfToken: false });
    dom.window.localStorage.removeItem('tokens');
    instance.setState({
      tokens: {
        [CSRF_TOKEN_KEY]: undefined
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
});
