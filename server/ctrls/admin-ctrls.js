import fs from "fs";
import { templateToHTML, sendMail } from "../services/mail-services.js";
import { handlebarsReplacements } from "../services/misc-services.js";
import fetch from "node-fetch";
import { API_CV_EVAL_ENDPOINT, API_JD_EVAL_ENDPOINT } from "../constants/endpoints.js";

export const rankCvs = async (req, res) => {
  try {
    const { apps } = req.body;
    const results = [];
    apps.forEach(async ({ file, userId, jobId, jd }) => {
      // read .txt file
      const cv = fs.readFileSync("media/" + file, "utf-8");
      const response = await fetch(API_CV_EVAL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ JD: jd, CV: cv, user_id: userId }),
      });
      const data = await response.json();
      results.push({ userId, jobId, score: data.data });
      if (results.length === apps.length) res.status(200).send(results);
    });
  } catch (err) {
    res.status(500).send({ error: err.message || "Something went wrong" });
  }
};

export const massMail = async (req, res) => {
  try {
    let cnt = 0;
    const { subject, message, mailIds } = req.body;
    if (mailIds.length === 0) return res.status(200).send({ message: "No mails to send" });
    else
      for (let i = 0; i < mailIds.length; i++) {
        const replacements = { message };
        const source = templateToHTML("templates/applicant.html");
        const content = handlebarsReplacements({ source, replacements });
        await sendMail({ to: mailIds[i], subject: subject + " | " + process.env.COMPANY, html: content });
        cnt++;
        if (cnt === mailIds.length) res.status(200).send({ message: "Mails sent successfully" });
      }
  } catch (err) {
    res.status(500).send({ error: err.message || "Something went wrong" });
  }
};

export const suggestDesc = async (req, res) => {
  try {
    const { desc, userId } = req.body;
    const response = await fetch(API_JD_EVAL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ JD: desc, user_id: userId }),
    });
    const data = await response.json();
    return res.status(200).send(data);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ error: err.message || "Something went wrong" });
  }
};
