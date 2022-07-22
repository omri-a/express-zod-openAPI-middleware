import type { OpenAPIV3 } from 'openapi-types';
import { Application } from 'express';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { when } from 'jest-when';
import { expressRetroSpective } from '../express-retrospective';
import { expressAppToApiSchema, OpenApiConfig } from '../express-retrospective-to-openapi-schema';
import { validate } from '../validation-middleware';

jest.mock('../express-retrospective');
jest.mock('zod-to-json-schema');

describe('express-retrospective-to-openapi-scehma', () => {
  const getSchema = (config: OpenApiConfig, retrospective: ReturnType<typeof expressRetroSpective>) => {
    jest.mocked(expressRetroSpective).mockReturnValue(retrospective);
    return expressAppToApiSchema(config, {} as Application);
  };

  let config: OpenApiConfig;

  beforeEach(() => {
    config = {
      info: {
        title: 'my title',
        version: '1.0.0',
      },
    };
  });

  afterEach(() => {
    /**
     * make sure we call zodToJsonSchema only with type = 'openApi3'
     */
    const zodToJsonSchemaTypes = [...new Set(jest.mocked(zodToJsonSchema).mock.calls.map((call) => call[1]?.target))];
    expect(
      zodToJsonSchemaTypes.length === 0 || (zodToJsonSchemaTypes.length === 1 && zodToJsonSchemaTypes[0] === 'openApi3')
    ).toBeTruthy();
  });

  it('should generate schema without routes', () => {
    const schema = getSchema(config, []);
    expect(schema).toStrictEqual(
      expect.objectContaining<ReturnType<typeof getSchema>>({
        info: {
          title: config.info.title,
          version: config.info.version,
        },
        openapi: '3.0.0',
        paths: {},
      })
    );
  });

  it('should skip handlers that are not registered with the middleware', () => {
    const schema = getSchema(config, [
      { method: 'get', path: '/path/to/get', params: [], handlers: [() => {}] },
      { method: 'get', path: '/registered/path', params: [], handlers: [validate({}), () => {}] },
    ]);
    expect(Object.keys(schema.paths)).toStrictEqual(['/registered/path']);
  });

  it('should set the method correctly', () => {
    const schema = getSchema(config, [
      { method: 'put', path: '/registered/path', params: [], handlers: [validate({}), () => {}] },
    ]);
    expect(Object.keys(schema.paths['/registered/path'] as {})).toStrictEqual(['put']);
  });

  it('should set the query params correctly', () => {
    const schema = getSchema(config, [
      {
        method: 'get',
        path: '/registered/path',
        params: [],
        handlers: [
          validate({
            query: {
              testParam: z.string(),
              optionalParam: z.string().optional(),
            },
          }),
          () => {},
        ],
      },
    ]);
    expect(schema.paths['/registered/path']!.get!.parameters).toStrictEqual<OpenAPIV3.ParameterObject[]>([
      expect.objectContaining({
        name: 'testParam',
        in: 'query',
        required: true,
      }),
      expect.objectContaining({
        name: 'optionalParam',
        in: 'query',
        required: false,
      }),
    ]);
  });

  it('should set the path params correctly', () => {
    const schema = getSchema(config, [
      {
        method: 'get',
        path: '/registered/path/:name/:optional?',
        params: [
          { name: 'name', optional: false },
          { name: 'optional', optional: true },
        ],
        handlers: [validate({}), () => {}],
      },
    ]);
    expect(schema.paths['/registered/path/:name/:optional?']!.get!.parameters).toStrictEqual<
      OpenAPIV3.ParameterObject[]
    >([
      expect.objectContaining({
        name: 'name',
        in: 'path',
        required: true,
      }),
      expect.objectContaining({
        name: 'optional',
        in: 'path',
        required: false,
      }),
    ]);
  });

  it('should set the body correctly', () => {
    const bodyZodObject = z.object({
      testParam: z.string(),
    });
    const mockedZodJsonSchema = {
      something: 'something',
    };
    when(jest.mocked(zodToJsonSchema))
      .calledWith(bodyZodObject, expect.anything())
      .mockReturnValue(mockedZodJsonSchema);
    const schema = getSchema(config, [
      {
        method: 'post',
        path: '/registered/path',
        params: [],
        handlers: [
          validate({
            body: bodyZodObject,
          }),
          () => {},
        ],
      },
    ]);
    expect(schema.paths['/registered/path']!.post!.requestBody).toStrictEqual<OpenAPIV3.RequestBodyObject>({
      required: true,
      content: {
        'application/json': {
          schema: mockedZodJsonSchema as any,
        },
      },
    });
  });

  it('should set response 200 correctly', () => {
    const responseZodObject = z.object({
      testParam: z.string(),
    });
    const mockedZodJsonSchema = {
      something: 'something',
    };
    when(jest.mocked(zodToJsonSchema))
      .calledWith(responseZodObject, expect.anything())
      .mockReturnValue(mockedZodJsonSchema);
    const schema = getSchema(config, [
      {
        method: 'post',
        path: '/registered/path',
        params: [],
        handlers: [
          validate({
            response: responseZodObject,
          }),
          () => {},
        ],
      },
    ]);
    expect(schema.paths['/registered/path']!.post!.responses['200']).toStrictEqual<OpenAPIV3.RequestBodyObject>({
      description: '',
      content: {
        'application/json': {
          schema: mockedZodJsonSchema as any,
        },
      },
    });
  });
  it('should set other responses correctly', () => {
    const response401ZodObject = z.object({
      testParam: z.string(),
    });
    const mocked401ZodJsonSchema = {
      something: 'something',
    };
    const response404ZodObject = z.object({
      testParam2: z.string(),
    });
    const mocked404ZodJsonSchema = {
      something2: 'something2',
    };

    when(jest.mocked(zodToJsonSchema))
      .calledWith(response401ZodObject, expect.anything())
      .mockReturnValue(mocked401ZodJsonSchema);

    when(jest.mocked(zodToJsonSchema))
      .calledWith(response404ZodObject, expect.anything())
      .mockReturnValue(mocked404ZodJsonSchema);

    const schema = getSchema(config, [
      {
        method: 'post',
        path: '/registered/path',
        params: [],
        handlers: [
          validate({
            statusCodes: {
              '401': response401ZodObject,
              '404': response404ZodObject,
            },
          }),
          () => {},
        ],
      },
    ]);

    expect(Object.keys(schema.paths['/registered/path']!.post!.responses)).toStrictEqual(['401', '404']);

    expect(schema.paths['/registered/path']!.post!.responses['401']).toStrictEqual<OpenAPIV3.RequestBodyObject>({
      description: '',
      content: {
        'application/json': {
          schema: mocked401ZodJsonSchema as any,
        },
      },
    });

    expect(schema.paths['/registered/path']!.post!.responses['404']).toStrictEqual<OpenAPIV3.RequestBodyObject>({
      description: '',
      content: {
        'application/json': {
          schema: mocked404ZodJsonSchema as any,
        },
      },
    });
  });
});
