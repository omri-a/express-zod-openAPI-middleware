# WORK IN PROGRESS
## This is not in NPM yet

```typescript
import { validate } from "express-zod";
import { z } from "zod";

router.post(
  "/purchase",
  validate({
    body: {
      productId: z.number(),
    },
  }),
  (req, res) => {
    // req.body is now type safe + validated + documented
    const { productId } = req.body; 
    /// ... 
  }
);
```

Sending a request with invalid body will result in an status 400 (bad request). You can customize the error handling:

```typescript
import { validate } from "express-zod";
import { z } from "zod";
app.post(
  "/purchase",
  validate({
    body: {
      productId: z.number(),
    },
    errorHandler: (error,req,res,next) => {
      console.error('Bad request'),
      res.status(400).json({reason: 'invalid body'});
    }
  }),
  (req, res) => {
    /// 
  }
);

```

You can also type and validate query string parameters:
```typescript
validate({
    query: {
      field1: z.string(),
      field2: z.string(),
    },
}),
```

And can type the responses:
```typescript
app.post(
  "/purchase",
  validate({
    response: {
      success: z.boolean(),
    }
  }),
  (req, res) => {
    // TS won't compile unless response is of type {success: boolean}
    res.json({success: true});
  }
);
```

## Auto documentation

```typescript
app.use(
  "/apidocs",
  openApiMiddleware({
    info: {
      title: "hi",
      version: "1.0.0",
    },
    redoc: true,
  })
);
```

Then go to `http://<YOUR-APP>/apidocs` to see a [redoc](https://github.com/Redocly/redoc) generated for your API.