const express = require('express');
const router = express.Router();

// Get User time by Id
export default async function handler(req, res) {
    let year = (new Date()).getFullYear() + 1;
    let weekoffDays = getDefaultOffDays(year);
    console.log(weekoffDays);
    return res.status(200).end('Hello Cron!');
}