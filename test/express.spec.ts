import { number, numberFromString, object, string } from "idonttrustlikethat"
import { Response, Route, route, router } from "typera-express"
import express from "express"
import { json } from "body-parser"
import request from "supertest"
import cookieParser from "cookie-parser"
import * as parsers from "../src/express"

describe("Parsers for express", () => {
  it("should correctly parse the query", async () => {
    const app = makeApp(route
      .get("/foo")
      .use(parsers.query(object({ query: string, limit: numberFromString })))
      .handler((req) => {
        const query: string = req.query.query
        const limit: number = req.query.limit
        return Response.ok({ query, limit })
      }))

    await request(app).get("/foo?query=foo&limit=10").expect(200, { query: "foo", limit: 10 })
  })

  it("should correctly parse the body", async () => {
    const app = makeApp(route
      .post("/foo")
      .use(parsers.body(object({ query: string, limit: number })))
      .handler((req) => {
        const query: string = req.body.query
        const limit: number = req.body.limit
        return Response.ok({ query, limit })
      }))

    await request(app).post("/foo").send({ query: "foo", limit: 10 }).expect(200, { query: "foo", limit: 10 })
  })

  it("should correctly parse the headers", async () => {
    const app = makeApp(route
      .get("/foo")
      .use(parsers.headers(object({ "X-Token": string, "API-KEY": string })))
      .handler((req) => {
        const xToken: string = req.headers["X-Token"]
        const apiKey: string = req.headers["API-KEY"]
        return Response.ok({ xToken, apiKey })
      }))

    await request(app)
      .get("/foo")
      .set("X-Token", "foo")
      .set("API-KEY", "bar")
      .expect(200, { xToken: "foo", apiKey: "bar" })
  })

  it("should correctly parse the cookies", async () => {
    const app = makeApp(route
      .get("/foo")
      .use(parsers.cookies(object({ username: string, password: string })))
      .handler((req) => {
        const username: string = req.cookies.username
        const password: string = req.cookies.password
        return Response.ok({ username, password })
      }))

    await request(app)
      .get("/foo")
      .set("Cookie", ["username=smart user", "password=Don't do this!"])
      .expect(200, { username: "smart user", password: "Don't do this!" })
  })
})

function makeApp(route: Route<any>): express.Express {
  const handler = router(route).handler()
  return express().use(json()).use(cookieParser()).use(handler)
}