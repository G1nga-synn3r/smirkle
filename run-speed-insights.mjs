// run-speed-insights.mjs
import { SpeedInsights } from "@vercel/speed-insights/next";

async function main() {
  const si = new SpeedInsights({
    url: "https://example.com",
    strategy: "mobile"
  });

  const result = await si.run();
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
