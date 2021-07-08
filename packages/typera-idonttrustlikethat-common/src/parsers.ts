import * as Middleware from "typera-common/middleware"
import * as Response from "typera-common/response"
import { ValidationError, Validator } from "idonttrustlikethat"

export const bodyP = <RequestBase>(getBody: GetInput<RequestBase>) => genericP(getBody, "body")

export const body = <RequestBase>(getBody: GetInput<RequestBase>) => generic(getBody, "body")

export const queryP = <RequestBase>(getQuery: GetInput<RequestBase>) => genericP(getQuery, "query")

export const query = <RequestBase>(getQuery: GetInput<RequestBase>) => generic(getQuery, "query")

export const headersP = <RequestBase>(getHeaders: GetInput<RequestBase>) => genericP(getHeaders, "headers")

export const headers = <RequestBase>(getHeaders: GetInput<RequestBase>) => generic(getHeaders, "headers")

export const cookiesP = <RequestBase>(getCookies: GetInput<RequestBase>) => genericP(getCookies, "cookies")

export const cookies = <RequestBase>(getCookies: GetInput<RequestBase>) => generic(getCookies, "cookies")

// Helpers

export type GetInput<RequestBase> = (req: RequestBase) => any

export type ErrorHandler<ErrorResponse extends Response.Generic> = (errors: Array<ValidationError>) => ErrorResponse

const genericP =
  <RequestBase, Key extends string>(input: (req: RequestBase) => any, key: Key) =>
  <T, ErrorResponse extends Response.Generic>(
    validator: Validator<T>,
    errorHandler: ErrorHandler<ErrorResponse>,
  ): Middleware.Middleware<RequestBase, Record<Key, T>, ErrorResponse> =>
  (req: RequestBase) => {
    const validation = validator.validate(input(req))
    if (validation.ok) {
      return Middleware.next({ [key]: validation.value } as any)
    } else {
      return Middleware.stop(errorHandler(validation.errors))
    }
  }

const generic =
  <RequestBase, Key extends string>(input: (req: RequestBase) => any, key: Key) =>
  <T>(validator: Validator<T>): Middleware.Middleware<RequestBase, Record<Key, T>, Response.BadRequest<string>> =>
    genericP(input, key)(validator, (err) => Response.badRequest(`Invalid ${key}: ${errorsToString(err)}`))

function errorsToString(errors: Array<ValidationError>): string {
  return JSON.stringify(errors)
}
