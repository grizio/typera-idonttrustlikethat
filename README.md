# typera-idonttrustlikethat

Support of [idonttrustlikethat](https://github.com/AlexGalays/idonttrustlikethat) on [typera](https://github.com/akheron/typera)

## Getting started

### Prerequisite

- Either `typera-express` or `typera-koa`
- `idonttrustlikethat`

### Install

#### typera + express

```
npm install typera-idonttrustlikethat-express
```

#### typera + koa

```
npm install typera-idonttrustlikethat-koa
```

### Usage

If you already use typera, replace the `Parser` import and the `Decoder` from `io-ts` by the `Validator` from `idonttrustlikethat`.
Below a complete example, inspired from [typera documentation](https://github.com/akheron/typera#tutorial).

```typescript
// Change "typera-express" to "typera-koa" if you're using Koa
import { Response, Route, URL, route } from "typera-express"
import { object, string, number } from "idonttrustlikethat"
// Change "typera-idonttrustlikethat-express" to "typera-idonttrustlikethat-koa" if you're using Koa
import { Parser } from "typera-idonttrustlikethat-express"

interface User {
  id: number
  name: string
  age: number
}

// Decodes an object { name: string, age: number }
const userBody = object({ name: string, age: number })

const updateUser: Route<
  Response.Ok<User> | Response.NotFound | Response.BadRequest<string>
> = route
  .put('/user/:id(int)') // Capture id from the path
  .use(Parser.body(userBody)) // Use the userBody decoder for the request body
  .handler(async (request) => {
    // This imaginary function takes the user id and data, and updates the
    // user in the database. If the user does not exist, it returns null.
    const user = await updateUserInDatabase(
      request.routeParams.id,
      request.body
    )

    if (user === null) {
      return Response.notFound()
    }

    return Response.ok({
      id: user.id,
      name: user.name,
      age: user.age,
    })
  })
```

### API

The API follows the same logic than the parsers of [typera](https://github.com/akheron/typera#request-parsers).

### Imports

```typescript
import { object, string, number } from "idonttrustlikethat"
import { Parser } from "typera-idonttrustlikethat-express"
// or
import { Parser } from "typera-idonttrustlikethat-koa"
```

### `Parser.query<T>(validator: Validator<T>): Middleware<{ query: T }, Response.BadRequest<string>>`

Validate the query string according to the given `Validator`. Respond with `400 Bad Request` if the validation fails.

⚠️ **Note**: The input for this parser will be the query string parsed as `Record<string, string>`, i.e. all parameter values will be strings.
If you want to convert them to other types, you should use `booleanFromString`, `numberFromString` or `intFromString`.

```typescript
// example: /search?query=test&limit=20
route
  .get('/search')
  .use(Parser.query(object({ query: string, limit: intFromString })))
  .handler(async (request) => {
    const query: string = request.query.query
    const limit: number = request.query.limit
    return Response.ok([])
  })
```

### `Parser.body<T>(validator: Validator<T>): Middleware<{ body: T }, Response.BadRequest<string>>`

Validate the request body according to the given `Validator`. Respond with `400 Bad Request` if the validation fails.

The input for this parser will be the request body, parsed with the body parser of your choice.
With Express you probably want to use [body-parser](https://github.com/expressjs/body-parser), and with Koa the most common choice is [koa-bodyparser](https://github.com/koajs/bodyparser).
Note that these are native Express or Koa middleware, so you must attach them directly to the Express or Koa app rather than use them as typera middleware.

⚠️ **Note**: You must use a Express or Koa body parsing middleware for `Parser.body` to work.

```typescript
import { json } from "body-parser"
// Or
import koaBodyparser from "koa-bodyparser"

const handler = router(
  route
    .get('/search')
    .use(Parser.query(object({ query: string, limit: intFromString })))
    .handler(async (request) => {
      const query: string = request.query.query
      const limit: number = request.query.limit
      return Response.ok([])
    })
).handler()

const app = express().use(json()).use(handler)
// Or
const app = new Koa().use(koaBodyparser()).use(handler)
```

### `Parser.headers<T>(validator: Validator<T>): Middleware<{ headers: T }, Response.BadRequest<string>>`

Validate the request headers according to the given `Validator`. Respond with `400 Bad Request` if the validation fails.

Header matching is case-insensitive, so using e.g. `X-API-KEY`, `x-api-key` and `X-Api-Key` in the codec will all read the same header.
However, the parse result will of course be case sensitive.
That is, the field in `request.headers` will have the name you specify in the `Validator` you pass to `Parser.headers`, with case preserved.

⚠️ **Note**: The input for this parser will be the headers parsed as `Record<string, string>`, i.e. all header values will be strings.
If you want to convert them to other types, you should use `booleanFromString`, `numberFromString` or `intFromString`.

### `Parser.cookies<T>(validator: Validator<T>): Middleware<{ cookies: T }, Response.BadRequest<string>>`

Validate the request cookies according to the given `Validator`. Respond with `400 Bad Request` if the validation fails.

⚠️ **Note**: The input for this parser will be the cookies parsed as `Record<string, string>`, i.e. all cookie values will be strings.
If you want to convert them to other types, you should use `booleanFromString`, `numberFromString` or `intFromString`.

### Customizing the error response

Each of the above functions also have a `P` flavor that allows the user to override error handling (same as typera default parsers).
In addition to a `Validator`, these functions take an error handler function that receives a validation error and produces an error response:

```typescript
type ErrorHandler<ErrorResponse extends Response.Response<number, any, any>> = (
  errors: Array<ValidationError>
) => ErrorResponse

function queryP<
  T,
  ErrorResponse extends Response.Response<number, any, any>
>(
  validator: Validator<T>,
  errorHandler: ErrorHandler<ErrorResponse>
): Middleware<{ query: T }, ErrorResponse>

function bodyP<
  T,
  ErrorResponse extends Response.Response<number, any, any>
>(
  validator: Validator<T>,
  errorHandler: ErrorHandler<ErrorResponse>
): Middleware<{ body: T }, ErrorResponse>

function headersP<
  T,
  ErrorResponse extends Response.Response<number, any, any>
>(
  validator: Validator<T>,
  errorHandler: ErrorHandler<ErrorResponse>
): Middleware<{ headers: T }, ErrorResponse>

function cookiesP<
  T,
  ErrorResponse extends Response.Response<number, any, any>
>(
  validator: Validator<T>,
  errorHandler: ErrorHandler<ErrorResponse>
): Middleware<{ cookies: T }, ErrorResponse>
```

If you want to abstract your custom error handling to reuse it in multiple routes, you can create your own parser functions like this:

```typescript
import { Validator } from "idonttrustlikethat"
import { Parser } from "typera-idonttrustlikethat-express" // or koa

function errorToString(err: t.Errors): string {
  // Turn err to string the way you like
}

const myQuery = <T>(
  validator: Validator<T>
): Middleware<{ body: T }, Response.BadRequest<string>> =>
  Parser.queryP(codec, (errors) => Response.badRequest(errorToString(errors)))

// You can also return a different response than 400 Bad Request
const myBody = <T>(
  validator: Validator<T>
): Middleware<{ body: T }, Response.Conflict<string>> =>
  Parser.bodyP(codec, (errors) => Response.conflict(errorToString(errors)))

// etc...
```