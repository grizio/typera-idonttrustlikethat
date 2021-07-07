import { number, numberFromString, object, string } from "idonttrustlikethat"
import { Response, Route, route, router } from "typera-koa"
import Koa from "koa"
import koaBodyparser from "koa-bodyparser"
import koaCookie from "koa-cookie"
import request from "supertest"
import type { Server } from "http"
import { Parser } from "../src/koa"

describe("Parsers for koa", () => {
  let server: Server | null = null
  afterEach(() => {
    if (server !== null) {
      server.close()
      server = null
    }
  })

  it("should correctly parse the query", async () => {
    server = makeApp(
      route
        .get("/foo")
        .use(Parser.query(object({ query: string, limit: numberFromString })))
        .handler((req) => {
          const query: string = req.query.query
          const limit: number = req.query.limit
          return Response.ok({ query, limit })
        }),
    )

    await request(server).get("/foo?query=foo&limit=10").expect(200, { query: "foo", limit: 10 })
  })

  it("should return an error because of the query", async () => {
    server = makeApp(
      route
        .get("/foo")
        .use(Parser.query(object({ query: string, limit: numberFromString })))
        .handler((req) => {
          const query: string = req.query.query
          const limit: number = req.query.limit
          return Response.ok({ query, limit })
        }),
    )

    await request(server).get("/foo?query=foo").expect(400)
  })

  it("should return a custom error because of the query", async () => {
    server = makeApp(
      route
        .get("/foo")
        .use(Parser.queryP(object({ query: string, limit: numberFromString }), Response.imATeapot))
        .handler((req) => {
          const query: string = req.query.query
          const limit: number = req.query.limit
          return Response.ok({ query, limit })
        }),
    )

    await request(server).get("/foo?query=foo").expect(418)
  })

  it("should correctly parse the body", async () => {
    server = makeApp(
      route
        .post("/foo")
        .use(Parser.body(object({ query: string, limit: number })))
        .handler((req) => {
          const query: string = req.body.query
          const limit: number = req.body.limit
          return Response.ok({ query, limit })
        }),
    )

    await request(server).post("/foo").send({ query: "foo", limit: 10 }).expect(200, { query: "foo", limit: 10 })
  })

  it("should return an error because of the body", async () => {
    server = makeApp(
      route
        .post("/foo")
        .use(Parser.body(object({ query: string, limit: number })))
        .handler((req) => {
          const query: string = req.body.query
          const limit: number = req.body.limit
          return Response.ok({ query, limit })
        }),
    )

    await request(server).post("/foo").send({ query: "foo" }).expect(400)
  })

  it("should return a custom error because of the body", async () => {
    server = makeApp(
      route
        .post("/foo")
        .use(Parser.bodyP(object({ query: string, limit: number }), Response.imATeapot))
        .handler((req) => {
          const query: string = req.body.query
          const limit: number = req.body.limit
          return Response.ok({ query, limit })
        }),
    )

    await request(server).post("/foo").send({ query: "foo" }).expect(418)
  })

  it("should correctly parse the headers", async () => {
    server = makeApp(
      route
        .get("/foo")
        .use(Parser.headers(object({ "X-Token": string, "API-KEY": string })))
        .handler((req) => {
          const xToken: string = req.headers["X-Token"]
          const apiKey: string = req.headers["API-KEY"]
          return Response.ok({ xToken, apiKey })
        }),
    )

    await request(server)
      .get("/foo")
      .set("X-Token", "foo")
      .set("API-KEY", "bar")
      .expect(200, { xToken: "foo", apiKey: "bar" })
  })

  it("should return an error because of the headers", async () => {
    server = makeApp(
      route
        .get("/foo")
        .use(Parser.headers(object({ "X-Token": string, "API-KEY": string })))
        .handler((req) => {
          const xToken: string = req.headers["X-Token"]
          const apiKey: string = req.headers["API-KEY"]
          return Response.ok({ xToken, apiKey })
        }),
    )

    await request(server).get("/foo").set("X-Token", "foo").expect(400)
  })

  it("should return a custom error because of the headers", async () => {
    server = makeApp(
      route
        .get("/foo")
        .use(Parser.headersP(object({ "X-Token": string, "API-KEY": string }), Response.imATeapot))
        .handler((req) => {
          const xToken: string = req.headers["X-Token"]
          const apiKey: string = req.headers["API-KEY"]
          return Response.ok({ xToken, apiKey })
        }),
    )

    await request(server).get("/foo").set("X-Token", "foo").expect(418)
  })

  it("should correctly parse the cookies", async () => {
    server = makeApp(
      route
        .get("/foo")
        .use(Parser.cookies(object({ username: string, password: string })))
        .handler((req) => {
          const username: string = req.cookies.username
          const password: string = req.cookies.password
          return Response.ok({ username, password })
        }),
    )

    await request(server)
      .get("/foo")
      .set("Cookie", ["username=smart user", "password=Don't do this!"])
      .expect(200, { username: "smart user", password: "Don't do this!" })
  })

  it("should return an error because of the cookies", async () => {
    server = makeApp(
      route
        .get("/foo")
        .use(Parser.cookies(object({ username: string, password: string })))
        .handler((req) => {
          const username: string = req.cookies.username
          const password: string = req.cookies.password
          return Response.ok({ username, password })
        }),
    )

    await request(server).get("/foo").set("Cookie", ["username=smart user"]).expect(400)
  })

  it("should return a custom error because of the cookies", async () => {
    server = makeApp(
      route
        .get("/foo")
        .use(Parser.cookiesP(object({ username: string, password: string }), Response.imATeapot))
        .handler((req) => {
          const username: string = req.cookies.username
          const password: string = req.cookies.password
          return Response.ok({ username, password })
        }),
    )

    await request(server).get("/foo").set("Cookie", ["username=smart user"]).expect(418)
  })
})

function makeApp(route: Route<any>): Server {
  const handler = router(route).handler()
  const app = new Koa().use(koaBodyparser()).use(koaCookie()).use(handler)
  return app.listen(8888)
}
