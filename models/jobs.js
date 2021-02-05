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

        if( data.length > 0 ){
            checkKeys(data, ['title', 'minSalary', 'equity']);
        }

        // If equity is not a boolean throw error
        // Refactor into own function
        if(data.equity){
            if (data.equity !== 'true'){
                if( data.equity !== 'false'){
                    throw new BadRequestError('Equity must be either true or false')
                }
            }
            // Change equity boolean to 0
            if(data.equity === 'true'){
                data.equity = 0;
            }else{
                delete data.equity;
            }
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
                    company_handle AS companyHandle
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
    static async getByID(id){
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

        if(!job) {
            throw new NotFoundError(`No job with id of ${id} found`)
        }

        return job;
    }

    static async patch(id, data){
        // Ensure that there is no change to either id or companyHandle
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
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
                    company_handle AS companyHandle`,
            [...values, id]
        );

        const job = result.rows[0];

        if(!job){
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