const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM companies");
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});



router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      `
    SELECT c.code, c.name, c.description, i.industry 
    FROM companies AS c
    LEFT JOIN company_industry AS ci
    ON c.code = ci.comp_code 
    LEFT JOIN industries AS i
    ON ci.ind_code = i.code
    WHERE c.code = $1`,
      [code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    const { name, description } = results.rows[0];
    const industries = results.rows.map((i) => i.industry);
    return res.send({ name, description, industries });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true });

    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:code", async (req, res, next) => {
  try {
    const code = req.params.code;
    const { name, description } = req.body;
    const results = await db.query(
      "UPDATE companies SET code =$1, name=$2, description=$3 WHERE code=$1 RETURNING code, name, description",
      [code, name, description]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't update company with id of ${code}`, 404);
    }
    return res.send({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const results = await db.query("DELETE FROM companies WHERE code = $1", [
      req.params.code,
    ]);
    return res.send(`msg: Company# ${req.params.code} has been deleted`);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
