// response-parser.js
export function processResponse(rawContent) {
  // Check for JSON code block first
  const codeBlockMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      // Validate the JSON and return the raw JSON string
      JSON.parse(codeBlockMatch[1]); // Just validate
      return codeBlockMatch[1].trim(); // Return the actual JSON string
    } catch (e) {
      // If code block JSON is invalid, treat as plain text
      return JSON.stringify({ message: rawContent });
    }
  }
  
  // Try to parse as direct JSON
  try {
    const parsed = JSON.parse(rawContent);
    return JSON.stringify(parsed);
  } catch (e) {
    // Not valid JSON, wrap as plain text
    return JSON.stringify({ message: rawContent });
  }
}