const GRAPHQL_URL = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";


async function gqlFetch(query, variables = {}, token) {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ query, variables })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map(e => e.message).join(", "));
    return json.data;
  } catch (error) {
    throw new Error(`GraphQL request failed: ${error.message}`);
  }
}