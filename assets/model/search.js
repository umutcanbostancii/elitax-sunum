const field = document.querySelector("#site-query");
const status = document.querySelector("#search-status");
const results = document.querySelector("#search-results");
const query = (new URLSearchParams(location.search).get("q") || "").trim().slice(0, field.maxLength);
field.value = query;

function normalize(value) {
  return value.toLocaleLowerCase("tr").normalize("NFD").replace(/\p{M}/gu, "").replaceAll("ı", "i");
}

async function showResults() {
  status.textContent = "Aranıyor…";
  try {
    const response = await fetch("index.json");
    if (!response.ok) throw new Error("Dizin yüklenemedi");
    const words = normalize(query).split(/\s+/);
    const matches = (await response.json()).map(row => {
      const title = normalize(row.title);
      const summary = normalize(row.summary);
      const text = normalize(row.text);
      const scores = words.map(word => title.includes(word) ? 3 : summary.includes(word) ? 2 : Number(text.includes(word)));
      return [row, scores.every(Boolean) ? scores.reduce((total, score) => total + score, 0) : 0];
    }).filter(([, score]) => score).sort((a, b) => b[1] - a[1]);
    status.textContent = matches.length
      ? `“${query}” için ${matches.length} sonuç`
      : `“${query}” için sonuç bulunamadı. Başka bir kelimeyle tekrar arayabilirsin.`;
    for (const [row] of matches) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const summary = document.createElement("p");
      link.href = new URL(row.path || ".", new URL("../", location.href));
      link.textContent = row.title;
      summary.textContent = row.summary;
      item.append(link, summary);
      results.append(item);
    }
  } catch {
    status.textContent = "Arama şu anda yüklenemiyor. Sayfayı yenileyerek tekrar deneyebilirsin.";
  }
}

if (query) showResults();
