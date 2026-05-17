type OperatorResortsResponse = {
  resorts?: unknown[];
};

export async function postLoginRedirectPath(accessToken: string | undefined, fallbackPath = "/create") {
  if (!accessToken) {
    return fallbackPath;
  }

  try {
    const response = await fetch("/api/operator/resorts", {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return fallbackPath;
    }

    const data = await response.json() as OperatorResortsResponse;
    return data.resorts && data.resorts.length > 0 ? "/dashboard" : fallbackPath;
  } catch {
    return fallbackPath;
  }
}
