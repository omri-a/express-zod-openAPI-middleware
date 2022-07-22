/**
 * This is a test for the typing inference feature.
 * If the compilation fails, something with the types is wrong.
 */

import { RequestHandler } from 'express';
import { expectType, TypeEqual } from 'ts-expect';
import { z } from 'zod';
import { validate } from '..';

type GetMiddlewareType<T> = T extends RequestHandler<any, infer Response, infer Body, infer Query>
  ? {
      response: Response;
      body: Body;
      query: Query;
    }
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const typesTest = (name: string, inner: () => void) =>
  it(name, () => {
    // if the compilation goes well, there is nothing to check
    expect(true).toBe(true);
  });

typesTest('empty options', () => {
  const middleware = validate({});
  expectType<TypeEqual<GetMiddlewareType<typeof middleware>, { query: unknown; body: unknown; response: unknown }>>(
    true
  );
});

typesTest('request body types are correct', () => {
  const middleware = validate({
    body: {
      field1: z.string(),
      nested: z.object({
        nestedField1: z.number(),
      }),
    },
  });

  expectType<
    TypeEqual<GetMiddlewareType<typeof middleware>['body'], { field1: string; nested: { nestedField1: number } }>
  >(true);
});

typesTest('request body types are correct when a zod object is given', () => {
  const middleware = validate({
    body: z
      .object({
        field1: z.string(),
        nested: z.object({
          nestedField1: z.number(),
        }),
      })
      .array(),
  });

  expectType<
    TypeEqual<GetMiddlewareType<typeof middleware>['body'], { field1: string; nested: { nestedField1: number } }[]>
  >(true);
});

typesTest('response body types are correct', () => {
  const middleware = validate({
    response: {
      field1: z.string(),
      nested: z.object({
        nestedField1: z.number(),
      }),
    },
  });

  expectType<
    TypeEqual<GetMiddlewareType<typeof middleware>['response'], { field1: string; nested: { nestedField1: number } }>
  >(true);
});

typesTest('response body types are correct when a zod object is given', () => {
  const middleware = validate({
    response: z
      .object({
        field1: z.string(),
        nested: z.object({
          nestedField1: z.number(),
        }),
      })
      .array(),
  });

  expectType<
    TypeEqual<GetMiddlewareType<typeof middleware>['response'], { field1: string; nested: { nestedField1: number } }[]>
  >(true);
});

typesTest('response body types are correct with status codes', () => {
  const middleware = validate({
    response: {
      field1: z.string(),
      nested: z.object({
        nestedField1: z.number(),
      }),
    },
    statusCodes: {
      404: {
        err1: z.string(),
      },
      500: {
        err2: z.number(),
      },
    },
  });

  expectType<
    TypeEqual<
      GetMiddlewareType<typeof middleware>['response'],
      { field1: string; nested: { nestedField1: number } } | { err1: string } | { err2: number }
    >
  >(true);
});

typesTest('response body types are correct with status codes when a zod object is given', () => {
  const middleware = validate({
    response: {
      field1: z.string(),
      nested: z.object({
        nestedField1: z.number(),
      }),
    },
    statusCodes: {
      404: {
        err1: z.string(),
      },
      500: z
        .object({
          err2: z.number(),
        })
        .array(),
    },
  });

  expectType<
    TypeEqual<
      GetMiddlewareType<typeof middleware>['response'],
      { field1: string; nested: { nestedField1: number } } | { err1: string } | { err2: number }[]
    >
  >(true);
});

typesTest('response body types are correct with only status codes', () => {
  const middleware = validate({
    statusCodes: {
      404: {
        err1: z.string(),
      },
      500: {
        err2: z.number(),
      },
    },
  });

  expectType<TypeEqual<GetMiddlewareType<typeof middleware>['response'], { err1: string } | { err2: number }>>(true);
});

typesTest('query types are correct', () => {
  const middleware = validate({
    query: {
      field1: z.string(),
      field2: z.string().optional(),
    },
  });

  expectType<TypeEqual<GetMiddlewareType<typeof middleware>['query'], { field1: string; field2?: string }>>(true);
});
