"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const Jobs = require("../models/jobs");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u3Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /jobs", function () {
  test("works for admin: create job", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "New Job",
            salary: 30000,
            equity: 0.01,
            companyHandle: "c1"
        })
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "New Job",
        salary: 30000,
        equity: "0.01",
        companyHandle: "c1",
    }});
  });

  test("doesn't work for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "New Job",
            salary: 30000,
            equity: 0.01,
            companyHandle: "c1"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        message: 'Unauthorized',
        status: 401
      }
    });
  });

  test("doesn't work for anon", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "New Job",
            salary: 30000,
            equity: 0.01,
            companyHandle: "c1"
        })
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        message: 'Unauthorized',
        status: 401
      }
    });
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "New Job",
            salary: 30000,
        })
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "New Job",
            salary: 30000,
            equity: 0.01,
            companyHandle: "c5"
        })
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual([{
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0",
        companyHandle: "c1"
    },{
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: "0",
        companyHandle: "c2"
    }]);
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp2 = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u3Token}`)
    expect(resp2.body).toEqual([{
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0",
        companyHandle: "c1"
    },{
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: "0",
        companyHandle: "c2"
    },{
        id: expect.any(Number),
        title: "j1",
        salary: 10000,
        equity: "0",
        companyHandle: "c1"
}]);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/jobs")
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /job/:id */

describe("GET /jobs/:id", function () {
  test("works for users", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .get(`/jobs/${newJob.id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: newJob
    });
  });

  test("unauth for anon", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .get(`/jobs/${newJob.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if job not found", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .get(`/jobs/${newJob.id + 4}`)
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", () => {
  test("works for admin", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .patch(`/jobs/${newJob.id}`)
        .send({
          title: "New",
        })
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual({
        job:{
        id: expect.any(Number),
        title: "New",
        salary: 10000,
        equity: "0",
        companyHandle: "c1"
      }});
  });

  test("unauth for anon", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .patch(`/jobs/${newJob.id}`)
        .send({
          title: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such job", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .patch(`/jobs/${newJob.id + 4}`)
        .send({
          title: "Nope",
        })
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .patch(`/jobs/${newJob.id}`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(400);
  });

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .delete(`/jobs/${newJob.id}`)
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.body).toEqual({ deleted: `${newJob.id}` });
  });

  test("unauth for anon", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .delete(`/jobs/${newJob.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const newJob = await Jobs.create({
        title: "j1",
        salary: 10000,
        equity: 0,
        companyHandle: "c1"
    });
    const resp = await request(app)
        .delete(`/jobs/${newJob.id + 4}`)
        .set("authorization", `Bearer ${u3Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
});