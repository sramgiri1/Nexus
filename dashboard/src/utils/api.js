// dashboard/src/utils/api.js
// Calls Ollama (local) for NEXUS chat in the Command Center

const OLLAMA_HOST  = import.meta.env.VITE_OLLAMA_HOST || "http://localhost:11434";
const NEXUS_MODEL  = import.meta.env.VITE_NEXUS_MODEL  || "llama3.2:3b";

export async function askNexus(messages, systemPrompt) {
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:    NEXUS_MODEL,
      stream:   false,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-12).map(m => ({
          role:    m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Ollama error ${res.status}`);
  return data.message?.content || "No response.";
}
