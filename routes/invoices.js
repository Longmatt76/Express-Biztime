const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");



router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT * FROM invoices");
    return res.json({ invoices: [results.rows] });
  } catch {
    return next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      "SELECT * FROM invoices, companies WHERE (invoices.comp_code = companies.code)"
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }
    const data = results.rows[0];
    return res.send({
      invoice: {
        id: data.id,
        paid: data.paid,
        add_date: data.add_date,
        paid_date: data.paid_date,
      },
      company: {
        code: data.code,
        name: data.name,
        description: data.description,
      },
    });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const comp_code = req.body.comp_code;
    const amt = req.body.amt;
    const results = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING * ",
      [comp_code, amt]
    );
    return res.status(201).json(results.rows);
  } catch (e) {
    return next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const { amt, paid } = req.body;
    let paidDate = null;

    const currResults = await db.query(
      "SELECT paid FROM invoices WHERE id = $1",
      [id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't update invoice with id of ${id}`, 404);
    }
    const currPaidDate = currResults.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paid_date = null;
    } else {
      paidDate = currPaidDate;
    }
    const result = await db.query(
      `
      UPDATE invoices SET amt = $1, paid= $2, paid_date= $3 
      WHERE id = $4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );

    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const results = await db.query("DELETE FROM invoices WHERE id = $1", [
      req.params.id,
    ]);
    return res.send(`msg: Invoice# ${req.params.id} has been deleted`);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;