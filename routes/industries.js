const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`
    SELECT i.industry, ci.comp_code
    FROM industries AS i
    LEFT JOIN company_industry AS ci
    ON i.code = ci.ind_code`);
    if (results.rows.length === 0) {
      throw new ExpressError("Industry not found", 404);
    }
    const industries = results.rows.reduce((acc, row) => {
      const industry = row.industry;
      const comp_code = row.comp_code;
      acc.push({ name: industry, comp_codes: [comp_code] });
      return acc;
    }, []);
    return res.send(industries);
  } catch (e) {
    return next(e);
  }
});

// adds an industry
router.post("/", async (req, res, next) => {
  const { code, industry } = req.body;
  try {
    results = await db.query(
      `INSERT INTO industries (code, industry) 
    VALUES ($1, $2) RETURNING code, industry`,
      [code, industry]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// allows for the association of a company and an industry

router.post("/:code", async (req, res, next) => {
    try {
      const code = req.params.code; // use req.params.code to get the company code
      const { ind_code } = req.body;
  
      const company = await db.query("SELECT * FROM companies where code = $1", [
        code,
      ]);
      const industry = await db.query(
        "SELECT * FROM industries WHERE code = $1",
        [ind_code] // add a comma after the string and pass in the ind_code parameter
      );
      if (company.rows.length === 0 || industry.rows.length === 0) {
        throw new ExpressError("Company or industry not found", 404);
      }
      const results = await db.query(
        `INSERT INTO company_industry
       (comp_code, ind_code) VALUES ($1, $2) RETURNING *`,
        [code, ind_code]
      );
      return res.send(results.rows[0]);
    } catch (e) {
      return next(e);
    }
  });
  

module.exports = router;
