import express, { Application, Router } from 'express';
import { expressRetroSpective } from '../express-retrospective';

describe('express retrospective', () => {
  let app: Application;

  const assertRetrospection = (expectedRetrospectiveResult: ReturnType<typeof expressRetroSpective>) => {
    expect(expressRetroSpective(app)).toStrictEqual(expectedRetrospectiveResult);
  };

  beforeEach(() => {
    app = express();
  });

  it('should detect paths', () => {
    app.get('/path1', () => {});
    app.get('/path2', () => {});
    assertRetrospection(
      ['/path1', '/path2'].map((path) => ({
        path,
        params: expect.anything(),
        handlers: expect.anything(),
        method: expect.anything(),
      }))
    );
  });

  it('should detect methods', () => {
    app.put('/path1', () => {});
    app.post('/path2', () => {});
    assertRetrospection(
      ['put', 'post'].map((method) => ({
        path: expect.anything(),
        params: expect.anything(),
        handlers: expect.anything(),
        method,
      }))
    );
  });

  it('should detect params', () => {
    app.put('/path1/:field1/:field2?', () => {});
    app.post('/path2/:field3/:field4/something', () => {});
    assertRetrospection(
      [
        [
          { name: 'field1', optional: false },
          { name: 'field2', optional: true },
        ],
        [
          { name: 'field3', optional: false },
          { name: 'field4', optional: false },
        ],
      ].map((params) => ({
        path: expect.anything(),
        params,
        handlers: expect.anything(),
        method: expect.anything(),
      }))
    );
  });

  it('should detect handlers correctly', () => {
    app.put('/path1', () => {});
    app.post(
      '/path2',
      () => {},
      () => {}
    );
    assertRetrospection(
      [[expect.anything()], [expect.anything(), expect.anything()]].map((handlers) => ({
        path: expect.anything(),
        params: expect.anything(),
        handlers,
        method: expect.anything(),
      }))
    );
  });

  it('should detect handler in a router', () => {
    const router = Router();
    router.get('/path', () => {});
    app.use('/router', router);
    assertRetrospection([
      {
        path: '/router/path',
        method: 'get',
        params: [],
        handlers: [expect.anything()],
      },
    ]);
  });

  it('should detect handler in a nested router', () => {
    const router = Router();
    const subRouter = Router();
    subRouter.get('/path', () => {});
    router.use('/sub', subRouter);
    app.use('/router', router);
    assertRetrospection([
      {
        path: '/router/sub/path',
        method: 'get',
        params: [],
        handlers: [expect.anything()],
      },
    ]);
  });
});
