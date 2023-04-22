const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

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
    const compResults = await db.query(
      "SELECT * FROM companies WHERE code = $1",
      [code]
    );
    const invResults = await db.query(
      "SELECT id FROM invoices WHERE comp_code = $1",
      [code]
    );
    if (compResults.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }
    const company = compResults.rows[0];
    const invoices = invResults.rows;
    company.invoices = invoices.map(inv => inv.id);

    return res.json({ company: company });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const code = req.body.code;
    const name = req.body.name;
    const description = req.body.description;

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
