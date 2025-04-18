import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { id } = req.query;
  const store = path.join("/tmp", "notes.json");
  const notesData = fs.existsSync(store) ? JSON.parse(fs.readFileSync(store)) : {};

  if (req.method === "POST") {
    const { text } = req.body;
    notesData[id] = [...(notesData[id] || []), { text, ts: Date.now() }];
    fs.writeFileSync(store, JSON.stringify(notesData));
    return res.status(201).json(notesData[id]);
  }

  // GET
  return res.status(200).json(notesData[id] || []);
}
