const express = require("express");
const client = require("prom-client");
const app = express();

const register = new client.Registry();

const summary = new client.Summary({
  name: "response_time_summary",
  help: "Response time for a request",
  percentiles: [0.5, 0.9, 0.99],
  registers: [register],
});

app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

app.get("/", (req, res) => {
  res.send("Summary Test");
  summary.observe((Date.now() - req.startTime) / 1000);
});

app.get("/metrix", async (req, res) => {
  res.end(await register.metrics());
});

port = 8080;
app.listen(port, () => {
  console.log(`Running on ${port}`);
});
