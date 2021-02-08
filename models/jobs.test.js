"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Jobs = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New Job",
    salary: 30000,
    equity: 0.01,
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Jobs.create(newJob);
    expect(job).toEqual({
        id: expect.any(Number),
        title: "New Job",
        salary: 30000,
        equity: "0.01",
        companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'New Job'`);
    expect(result.rows).toEqual([
      {
        title: "New Job",
        salary: 30000,
        equity: "0.01",
        company_handle: "c1"
      },
    ]);
  });

  test("bad request with missing info", async function () {
    try {
      await Jobs.create({
        title : 'Job1',
        salary : 25000
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Jobs.findAll({});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 10000,
        equity: "0.010",
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 20000,
        equity: '0.010',
        companyHandle: "c3",
      }
    ]);
  });
  // TODO: 
});

/************************************** get */

describe("get", function () {
  test("by company works", async function () {
    let jobs = await Jobs.getByCompany("c2");
    expect(jobs).toEqual([{
      id: expect.any(Number),
        title: "j1",
        salary: 10000,
        equity: "0.010",
        companyHandle: "c2"
    }]);
  })
  
  test("by id works", async function () {
    let job = await Jobs.create({
      title: "J4",
      salary: 15000,
      equity: 0,
      companyHandle: "c1"
    })

    let checkJob = await Jobs.getByID(job.id);
    expect(checkJob).toEqual({
      id: expect.any(Number),
      title: "J4",
      salary: 15000,
      equity: "0",
      companyHandle: "c1"
    })
  });

  test("not found if no such company", async function () {
    try {
      await Jobs.getByCompany("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {

  const updateData = {
    title: "New",
    salary: 30000,
    equity: 0.02
  };

  test("works", async function () {
    const newJob = await Jobs.create({
      title: "j4",
      salary: 20000,
      equity: 0,
      companyHandle: "c1"
    });

    let job = await Jobs.patch(newJob.id, updateData);
    expect(job).toEqual({
      id: newJob.id,
      title: "New",
      salary: 30000,
      equity: "0.02",
      companyHandle: "c1"
    });
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: 77000,
      equity: null
    };

    const newJob = await Jobs.create({
      title: "j4",
      salary: 20000,
      equity: 0,
      companyHandle: "c1"
    });

    let job = await Jobs.patch(newJob.id, updateDataSetNulls);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New",
      salary: 77000,
      equity: null,
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
           [newJob.id]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "New",
      salary: 77000,
      equity: null,
      companyHandle: "c1"
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Jobs.patch(404, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const newJob = await Jobs.create({
      title: "j4",
      salary: 20000,
      equity: 0,
      companyHandle: "c1"
    });

    try {
      await Jobs.patch(newJob.id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const newJob = await Jobs.create({
      title: "j4",
      salary: 20000,
      equity: 0,
      companyHandle: "c1"
    });

    await Jobs.remove(newJob.id);

    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [newJob.id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Jobs.remove(404);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
