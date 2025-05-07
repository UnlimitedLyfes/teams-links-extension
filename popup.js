const fs = require('fs');

const schedjson = fs.readFileSync('schedule.json', 'utf8');
const schedule = JSON.parse(schedjson)

