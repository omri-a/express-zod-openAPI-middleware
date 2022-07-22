import { Request as ExpressRequest, Response } from 'express';
import { z, ZodError } from 'zod';
import { validate } from '../validation-middleware';

type Request = ExpressRequest<any, any, any, any>;

describe('validation middleware', () => {
  const next = jest.fn();
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn();
  });

  it('should call next when no validation config is provided', () => {
    validate({})(req as Request, res as Response, next);
    expect(next).toBeCalledTimes(1);
  });

  describe('body', () => {
    it('should not call next if body is invalid', () => {
      req.body = {
        name: 3,
      };
      validate({
        body: {
          name: z.string(),
        },
      })(req as Request, res as Response, next);
      expect(next).not.toBeCalled();
    });

    it('should call next if body is valid', () => {
      req.body = {
        name: 'a string',
      };
      validate({
        body: {
          name: z.string(),
        },
      })(req as Request, res as Response, next);
      expect(next).toBeCalledTimes(1);
    });

    it('should set req.body as the parsed results', () => {
      req.body = {
        name: 'abc',
      };
      validate({
        body: {
          name: z.string().transform((arg) => `${arg}123`),
        },
      })(req as Request, res as Response, next);
      expect(req.body.name).toEqual('abc123');
    });

    it('should call next if body is invalid but bodyThrowsError=false', () => {
      req.body = {
        name: 'max',
      };
      validate({
        body: {
          firstName: z.string(),
        },
        bodyThrowsError: false,
      })(req as Request, res as Response, next);
      expect(next).toBeCalledTimes(1);
    });
  });

  describe('query', () => {
    it('should not call next if query is invalid', () => {
      req.query = {
        name: 'max',
      };
      validate({
        query: {
          firstName: z.string(),
        },
      })(req as Request, res as Response, next);
      expect(next).not.toBeCalled();
    });

    it('should call next if query is valid', () => {
      req.query = {
        name: 'max',
      };
      validate({
        query: {
          name: z.string(),
        },
      })(req as Request, res as Response, next);
      expect(next).toBeCalledTimes(1);
    });

    it('should set req.query as the parsed results', () => {
      req.query = {
        name: 'abc',
      };
      validate({
        query: {
          name: z.string().transform((arg) => `${arg}123`),
        },
      })(req as Request, res as Response, next);
      expect(req.query.name).toEqual('abc123');
    });

    it('should call next if query is invalid but queryThrowsError=false', () => {
      req.query = {
        name: 'max',
      };
      validate({
        query: {
          firstName: z.string(),
        },
        queryThrowsError: false,
      })(req as Request, res as Response, next);
      expect(next).toBeCalledTimes(1);
    });
  });

  describe('body & query', () => {
    it('should call next if both body and query is valid', () => {
      req.query = {
        queryField: 'q',
      };
      req.body = {
        bodyField: 'b',
      };
      validate({
        query: {
          queryField: z.string(),
        },
        body: {
          bodyField: z.string(),
        },
      })(req as Request, res as Response, next);
      expect(next).toBeCalledTimes(1);
    });

    it('should not call next if query is valid but body is not', () => {
      req.query = {
        queryField: 'q',
      };
      req.body = {
        bodyField2: 'b',
      };
      validate({
        query: {
          queryField: z.string(),
        },
        body: {
          bodyField: z.string(),
        },
      })(req as Request, res as Response, next);
      expect(next).not.toBeCalled();
    });

    it('should not call next if body is valid but query is not', () => {
      req.query = {
        queryField2: 'q',
      };
      req.body = {
        bodyField: 'b',
      };
      validate({
        query: {
          queryField: z.string(),
        },
        body: {
          bodyField: z.string(),
        },
      })(req as Request, res as Response, next);
      expect(next).not.toBeCalled();
    });
  });

  describe('errorHandler', () => {
    it('should call the custom errorHandler, if provided', () => {
      const customErrorHandler = jest.fn();
      req.body = {
        invalid: 'invalid',
      };
      validate({
        body: {
          name: z.string(),
        },
        errorHandler: customErrorHandler,
      })(req as Request, res as Response, next);
      expect(customErrorHandler).toBeCalledTimes(1);
      expect(customErrorHandler.mock.calls[0][0]).toBeInstanceOf(ZodError);
      expect(customErrorHandler.mock.calls[0][1]).toBe(req);
      expect(customErrorHandler.mock.calls[0][2]).toBe(res);
      expect(customErrorHandler.mock.calls[0][3]).toBe(next);
      expect(res.status).not.toBeCalled();
    });
  });
});
