import { useState } from "react";

export default function QueryForm() {
  const [dbType, setDbType] = useState("");
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-4">
      <select
        value={dbType}
        onChange={(e) => setDbType(e.target.value)}
        className="border p-2 w-full"
      >
        <option value="">Choose database type</option>
        <option value="mysql">MySQL</option>
        <option value="postgresql">PostgreSQL</option>
        <option value="sqlite">SQLite</option>
      </select>

      <textarea
        className="border p-2 w-full"
        placeholder="Describe your query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button className="bg-blue-500 text-white p-2 w-full">
        Generate SQL Query
      </button>
    </div>
  );
}
