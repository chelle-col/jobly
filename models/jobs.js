"use strict";

const {
    database
} = require("../db");
const db = require("../db");
const {
    BadRequestError,
    NotFoundError
} = require("../expressError");
const {
    sqlForPartialUpdate,
    makeWhereQuery,
    checkKeys
} = require("../helpers/sql");

class Jobs {


    static async create({
        title,
        salary,
        equity,
        companyHandle
    }) {
        const companyCheck = await db.query(
            `SELECT handle 
            FROM companies
            WHERE handle = $1`,
            [companyHandle]
        )
        if (companyCheck.rows.length === 0) {
            throw new BadRequestError(`No company exisits with handle: ${companyHandle}`);
        }

        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle`,
            [title, salary, equity, companyHandle]
        )

        const job = result.rows[0]
        return job;
    }

    /** Find all jobs
     * 
     *  Returns [{id, title, salary, equity, companyHandle}]
     */
    static async findAll(data){

        checkKeys(data, ['title', 'minSalary', 'equity']);

        // // If equity is not a boolean throw error
        // if (typeof equity !== 'boolean'){
        //     console.log('error here');
        // }
        // Change equity boolean to 0

        const query = makeWhereQuery(data, {
            title: "iLIKE",
            minSalary: ">",
            equity: ">"
        }, {
            minSalary: 'salary'
        });
        const jobsRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle
            FROM jobs
            ${query.where}`,
            query.values
        )
        return jobsRes.rows;
    }
}

module.exports = Jobs;