"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Jobs = require("../models/jobs");

const jobNewSchema = require("../schemas/jobsNew.json");
const jobSearchSchema = require("../schemas/jobSearch.json");
const updateJobSchema = require("../schemas/updateJob.json");
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
        const validator = jsonschema.validate(req.body, jobSearchSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const jobs = await Jobs.findAll(req.query);
        return res.json(jobs);
    }catch (err){
        next(err)
    }
});


/**GET /:id => { job }
 * Job is { id, title, salary, equity, company_handle }
 * 
 * Authorization required: logged in
 */
router.get('/:id', ensureLoggedIn, async function(req, res, next){
    try{
        const job = await Jobs.getByID(req.params.id);
        return res.json({ job });
    }catch (err){
        next(err)
    }
});

/**PATCH /:id { fld1, fld2, ... } => { job }
 * 
 * Patches job data.
 * 
 * Fields can be { title, salary, equity }
 * 
 * Returns { id, salary, equity, companyHandle }
 * 
 * Authorization required: admin
 */
router.patch('/:id', ensureAdmin, async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, updateJobSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Jobs.patch(req.params.id, req.body);
        return res.json({ job });
    }catch (err){
        next(err)
    }
})

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */
router.delete('/:id', ensureAdmin, async function(req, res, next){
    try{
        await Jobs.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    }catch (err){
        next(err)
    }
})

module.exports = router;