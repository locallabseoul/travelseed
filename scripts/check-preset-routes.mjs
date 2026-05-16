const baseUrl = process.env.PRESET_ROUTE_BASE_URL ?? "http://localhost:3000";
const slug = process.env.PRESET_ROUTE_SLUG ?? "locallab";

const presetRoutes = process.env.PRESET_ROUTE_PATHS
  ? process.env.PRESET_ROUTE_PATHS.split(",").map((route) => route.trim()).filter(Boolean)
  : ["/promotions"];

const expectedTextByRoute = {
  "/dining": "Dining",
  "/promotions": "Direct booking offers",
  "/activities": "Activities",
  "/nearby-attractions": "Nearby Attractions",
  "/spa-wellness": "Spa & Wellness",
  "/weddings": "Weddings & Events",
};

async function checkRoute(route) {
  const url = `${baseUrl.replace(/\/+$/, "")}/${slug}${route}`;
  const response = await fetch(url, { redirect: "manual" });
  const body = await response.text();
  const expectedText = expectedTextByRoute[route];

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  if (!body.includes(expectedText)) {
    throw new Error(`${url} did not include expected text: ${expectedText}`);
  }

  return `${route} ${response.status}`;
}

try {
  const results = [];

  for (const route of presetRoutes) {
    results.push(await checkRoute(route));
  }

  console.log(`Preset route smoke check passed for ${baseUrl}/${slug}`);
  for (const result of results) {
    console.log(`- ${result}`);
  }
} catch (error) {
  console.error("Preset route smoke check failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
