import * as commonParser from './common'
import * as commonResponse from 'typera-common/response'
import { RequestBase } from "typera-koa"

export type ErrorHandler<ErrorResponse extends commonResponse.Generic> =
  commonParser.ErrorHandler<ErrorResponse>

function getBody(req: RequestBase): any {
  return req.ctx.request.body
}
export const bodyP = commonParser.bodyP(getBody)
export const body = commonParser.body(getBody)

function getQuery(req: RequestBase): any {
  return req.ctx.request.query
}
export const queryP = commonParser.queryP(getQuery)
export const query = commonParser.query(getQuery)

function getHeaders(req: RequestBase): any {
  return new Proxy(req.ctx, {
    get: (target, field) =>
      typeof field === 'string' ? target.get(field) : undefined,
  })
}
export const headersP = commonParser.headersP(getHeaders)
export const headers = commonParser.headers(getHeaders)

function getCookies(req: RequestBase): any {
  return req.ctx.cookie
}
export const cookiesP = commonParser.cookiesP(getCookies)
export const cookies = commonParser.cookies(getCookies)