const wait = require("waait");
const { Registry, Pushgateway, Gauge } = require("prom-client");

const register = new Registry();

const gauge = new Gauge({
  name: "batch_process_time_second",
  help: "Time taken for batch job to complete",
  registers: [register],
});

// 30% 확률로 실패하는 배치잡 구현
async function batchJob() {
  if (Math.random() < 0.3) {
    throw new Error("batch job failed");
  } else {
    await wait(2 * Math.random() * 1000);
  }
}

const main = (async function () {
  try {
    const startTime = Date.now();
    await batchJob();
    gauge.set((Date.now() - startTime) / 1000);
  } catch (error) {
    gauge.set(-1);
  }
  const gateway = new Pushgateway("http://localhost:9091", [], register);
  gateway.push({
    jobName: "batch",
    groupings: { instance: "batch-server" },
  });

  return setTimeout(
    () => {
      gateway.delete({
        jobName: "batch",
        groupings: { instance: "batch-server" },
      });
    },
    // scrape_interval의 2배.
    4000
  );
})();
