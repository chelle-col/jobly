"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Jobs = require("../models/jobs");

const jobNewSchema = require("../schemas/jobsNew.json");
const jobSearchSchema = require("../schemas/jobSearchSchema.json");
const { json } = require("body-parser");
// const jobUpdateSchema = require("../schemas/jobsUpdate.json");

const router = new express.Router();

/**POST / { job } => { job }
 * 
 * Job should be { title, salary, equity, companyHandle }
 * 
 * Returns { id, title, salary, equity, companyHandle }
 * 
 * Authorization requires: login
 */

router.post('/', ensureLoggedIn, async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Jobs.create(req.body);
        console.log(job);
        return res.status(201).json({ job });
    }catch (err){
        next(err)
    }
})

/** GET / =>
 *      {jobs: [ { id, title, salary, equity, companyHandle }]}
 * Can filter on provided search filters:
 * - 
 * 
 * Authorization required: none
 */
router.get('/', ensureLoggedIn, async function(req, res, next){
    try{
        const jobs = await Jobs.findAll(req.query);
        return res.json(jobs);
    }catch (err){
        next(err)
    }
})

router.get('/:id', ensureLoggedIn, async function(req, res, next){
    try{

    }catch (err){
        next(err)
    }
})

router.patch('/:id', ensureLoggedIn, async function(req, res, next){
    try{

    }catch (err){
        next(err)
    }
})

router.delete('/:id', ensureLoggedIn, async function(req, res, next){
    try{

    }catch (err){
        next(err)
    }
})

module.exports = router;