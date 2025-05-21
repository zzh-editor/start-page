import { GoogleGenerativeAI } from '@google/generative-ai';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const apiKey = undefined                              ;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const googleSearchApiKey = undefined                                     ;
const googleSearchEngineId = undefined                                       ;
const GET = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const getResults = searchParams.get("results") === "true";
  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    if (getResults) {
      const searchResults = await fetchGoogleSearchResults(query);
      if (searchResults.length === 0) {
        const response2 = await model.generateContent(query);
        const aiResponse = response2.response.text().trim();
        return new Response(JSON.stringify({ result: aiResponse }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      const promptWithResults = `Based on the following search results for "${query}", which one is the most relevant and useful? Return ONLY the URL of the best result without any additional text.
      
Results:
${searchResults.map((r, i) => `${i + 1}. Title: ${r.title}
   URL: ${r.link}
   Snippet: ${r.snippet || "N/A"}
`).join("\n")}`;
      const response = await model.generateContent(promptWithResults);
      const bestUrl = response.response.text().trim();
      return new Response(JSON.stringify({
        result: bestUrl,
        allResults: searchResults
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const response = await model.generateContent(query);
      const aiResponse = response.response.text().trim();
      return new Response(JSON.stringify({ result: aiResponse }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
async function fetchGoogleSearchResults(query) {
  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.append("key", googleSearchApiKey);
    url.searchParams.append("cx", googleSearchEngineId);
    url.searchParams.append("q", query);
    url.searchParams.append("num", "5");
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      return [];
    }
    return data.items.map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet || ""
    }));
  } catch (error) {
    console.error("Error fetching Google search results:", error);
    return [];
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
