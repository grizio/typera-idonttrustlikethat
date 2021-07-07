import { number, numberFromString, object, string } from "idonttrustlikethat"
import { Response, route, router } from "typera-koa"
import Koa from "koa"
import koaBodyparser from "koa-bodyparser"
import koaCookie from "koa-cookie"
import request from "supertest"
import type { Server } from "http"
import * as parsers from "../src/koa"

describe("Parsers for koa", () => {
  let server: Server | null = null
  afterEach(() => {
    if (server !== null) {
      server.close()
      server = null
    }
  })

  it("should correctly parse the query", async () => {
    const foo = route
      .get("/foo")
      .use(parsers.query(object({ query: string, limit: numberFromString })))
      .handler((req) => {
        const query: string = req.query.query
        const limit: number = req.query.limit
        return Response.ok({ query, limit })
      })

    const handler = router(foo).handler()
    const app = new Koa().use(handler)
    server = app.listen(8888)

    await request(server).get("/foo?query=foo&limit=10").expect(200, { query: "foo", limit: 10 })
  })

  it("should correctly parse the body", async () => {
    const foo = route
      .post("/foo")
      .use(parsers.body(object({ query: string, limit: number })))
      .handler((req) => {
        const query: string = req.body.query
        const limit: number = req.body.limit
        return Response.ok({ query, limit })
      })

    const handler = router(foo).handler()
    const app = new Koa().use(koaBodyparser()).use(handler)
    server = app.listen(8888)

    await request(server).post("/foo").send({ query: "foo", limit: 10 }).expect(200, { query: "foo", limit: 10 })
  })

  it("should correctly parse the headers", async () => {
    const foo = route
      .get("/foo")
      .use(parsers.headers(object({ "X-Token": string, "API-KEY": string })))
      .handler((req) => {
        const xToken: string = req.headers["X-Token"]
        const apiKey: string = req.headers["API-KEY"]
        return Response.ok({ xToken, apiKey })
      })

    const handler = router(foo).handler()
    const app = new Koa().use(handler)
    server = app.listen(8888)

    await request(server)
      .get("/foo")
      .set("X-Token", "foo")
      .set("API-KEY", "bar")
      .expect(200, { xToken: "foo", apiKey: "bar" })
  })

  it("should correctly parse the cookies", async () => {
    const foo = route
      .get("/foo")
      .use(parsers.cookies(object({ username: string })))
      .handler((req) => {
        const username: string = req.cookies.username
        return Response.ok({ username })
      })

    const handler = router(foo).handler()
    const app = new Koa().use(koaCookie()).use(handler)
    server = app.listen(8888)

    await request(server).get("/foo").set("Cookie", "username=smart user").expect(200, { username: "smart user" })
  })
})
