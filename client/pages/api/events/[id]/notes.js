/**
 * Front‑end‑only stub:
 * reads/writes to a module‑level variable so you can demo note adding
 * without a database. Data resets when the serverless function re‑boots.
 */
let store = {};

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    const { text } = req.body;
    store[id] = [...(store[id] || []), { text, ts: Date.now() }];
    return res.status(201).json(store[id]);
  }

  // GET
  return res.status(200).json(store[id] || []);
}
