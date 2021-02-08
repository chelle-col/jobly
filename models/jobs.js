"use strict";

const db = require("../db");
const {
    BadRequestError,
    NotFoundError
} = require("../expressError");
const {
    sqlForPartialUpdate,
    makeWhereQuery
} = require("../helpers/sql");

/** Related functions foro jobs */

class Jobs {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * */

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

        const queryString = `INSERT INTO jobs
        (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;


        const result = await db.query(
            queryString,
            [title, salary, equity, companyHandle]
        )

        const job = result.rows[0]
        return job;
    }

    /** Find all jobs
     * 
     *  Returns [{id, title, salary, equity, companyHandle}]
     */
    static async findAll(data) {

        // Refactor into own function
        if (data.hasEquity === true) {
            // Change equity boolean to 0
            data.equity = 0;
            delete data.hasEquity;
        } else {
            delete data.hasEquity;
        }

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
                    company_handle AS "companyHandle"
            FROM jobs
            ${query.where}`,
            query.values
        )
        return jobsRes.rows;
    }

    /** Given a job id, returns data about job
     * 
     * Returns { id, title, salary, equity, companyHandle }
     * 
     * Throws NotFoundError if not found
     */
    static async getByID(id) {
        const results = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [id]
        );

        const job = results.rows[0]

        if (!job) {
            throw new NotFoundError(`No job with id of ${id} found`)
        }

        return job;
    }

    /**Returns all jobs posted by a given company
     * 
     * Returns [{ id, title, salary, equity, companyHandle }, ...]
     * 
     * If no jobs returns an empty array
     */
    static async getByCompany(company){
        const result = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE company_handle = $1`,
            [company]
        )
        return result.rows;
    }

    static async patch(id, data) {
        const {
            setCols,
            values
        } = sqlForPartialUpdate(
            data, {
                companyHandle: 'company_handle'
            }
        );
        const idVarIdx = '$' + (values.length + 1);

        const result = await db.query(
            `UPDATE jobs
            SET ${setCols}
            WHERE id = ${idVarIdx}
            RETURNING id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"`,
            [...values, id]
        );

        const job = result.rows[0];

        if (!job) {
            throw new NotFoundError(`No job with id of ${id} found`)
        }

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/
    static async remove(id) {
        const result = await db.query(
            `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No company: ${job}`);
    }
}

module.exports = Jobs;