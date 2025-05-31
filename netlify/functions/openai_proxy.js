// netlify/functions/openai-proxy.js
exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
  
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }
  
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
  
    // Get OpenAI API key from environment
    console.log("Checking for OPENAI_API_KEY...");
    const openai_key = process.env.OPENAI_API_KEY;
    
    console.log("API key found:", openai_key ? `YES (length: ${openai_key.length})` : 'NO');
    console.log("API key starts with:", openai_key ? openai_key.substring(0, 7) : 'N/A');
  
    if (!openai_key) {
      console.error("ERROR: No API key found in environment variables");
      console.error("Available environment variables:", Object.keys(process.env).join(', '));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured. Check function logs for details.' })
      };
    }
  
    // Parse request body
    console.log("Raw POST data length:", event.body ? event.body.length : 0);
    console.log("Raw POST data preview:", event.body ? event.body.substring(0, 200) : 'No body');
  
    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON data' })
      };
    }
  
    // Validate required fields
    if (!data.messages) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: messages' })
      };
    }
  
    // Parse the messages data
    let messagesData;
    try {
      messagesData = JSON.parse(data.messages);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid messages data' })
      };
    }
  
    // Debug: Log the raw messages data
    // console.log("Raw messages data:", JSON.stringify(messagesData, null, 2));
    // console.log("Number of messages:", messagesData.length);
  
    // Check each message for image data
    messagesData.forEach((msg, index) => {
      console.log(`Message ${index} - Role:`, msg.role || 'unknown');
      console.log(`Message ${index} - Has message:`, msg.message ? 'YES' : 'NO');
      console.log(`Message ${index} - Has image:`, msg.image ? 'YES' : 'NO');
      
      if (msg.image) {
        console.log(`Message ${index} - Image data length:`, msg.image.length);
        console.log(`Message ${index} - Image data starts with:`, msg.image.substring(0, 50));
        console.log(`Message ${index} - Image data ends with:`, msg.image.slice(-20));
      }
      
      // Log all keys in this message
      console.log(`Message ${index} - All keys:`, Object.keys(msg).join(', '));
    });
  
    // Custom prompt for image identification
    const custom_prompt = "You are a specialized car identification assistant. You ONLY analyze and discuss cars in images. You MUST receive an image to respond and the image MUST contain a car or vehicle. If no image is provided, respond 'Please provide an image of a car for me to analyze.' If the image contains no car, respond 'I can only analyze cars. Please provide an image that contains a car.' If the image contains other objects along with a car, focus EXCLUSIVELY on the car. NEVER discuss anything other than cars, vehicles, or automotive topics. Always respond in plain text only with no formatting, no markdown, and no lists. Identify the car's make, model, year if possible, and provide relevant automotive details such as features, specifications, or interesting facts about that particular vehicle.";
  
    // Prepare messages array for OpenAI
    const messages = [
      {
        role: "system",
        content: custom_prompt
      }
    ];
  
    // Process each message from the iOS app
    messagesData.forEach(msg => {
      const openai_message = {
        role: msg.role === 'user' ? 'user' : 'assistant'
      };
      
      // Handle text and image content
      if (msg.image && msg.image.trim() !== '') {
        // Message with image
        const content = [];
        
        // Add text if present
        if (msg.message && msg.message.trim() !== '') {
          content.push({
            type: "text",
            text: msg.message
          });
        }
        
        // Add image
        content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${msg.image}`
          }
        });
        
        openai_message.content = content;
      } else {
        // Text-only message
        openai_message.content = msg.message || '';
      }
      
      messages.push(openai_message);
    });
  
    // Prepare payload for OpenAI
    const payload = {
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1500
    };
  
    // Debug: Log the payload structure
    console.log("Payload being sent to OpenAI:", JSON.stringify(payload, null, 2));
  
    // Send request to OpenAI
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openai_key}`
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        return {
          statusCode: response.status,
          headers,
          body: errorText
        };
      }
  
      const openaiResponse = await response.json();
      
      if (!openaiResponse || !openaiResponse.choices || !openaiResponse.choices[0] || !openaiResponse.choices[0].message) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Invalid response from OpenAI' })
        };
      }
  
      // Return just the message content to match your iOS app's expectation
      return {
        statusCode: 200,
        headers,
        body: openaiResponse.choices[0].message.content
      };
  
    } catch (error) {
      console.error('Request failed:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `Request failed: ${error.message}` })
      };
    }
  };