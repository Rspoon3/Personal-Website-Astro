// netlify/functions/openai-proxyV3.js
//
// To run locally:
// 1. cd /Users/richardwitherspoon/Documents/Personal-Website-Astro
// 2. netlify dev (starts Netlify functions on localhost:8888)
// 3. Update iOS app ConversationService proxyURL to: http://localhost:8888/.netlify/functions/openai_proxyV3
// 4. Make sure OPENAI_API_KEY is set in .env file

import { processResponse } from '../helpers/response_parser.js';
import { verifyHMAC } from '../helpers/auth_hmac.js';

export const handler = async (event, context) => {
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

    // 🔒 HMAC verification
    const authCheck = verifyHMAC(event.headers);
    if (!authCheck.ok) {
      return {
        statusCode: authCheck.code,
        headers,
        body: JSON.stringify({ error: authCheck.reason })
      };
    }

  // Get OpenAI API key from environment
  const openai_key = process.env.OPENAI_API_KEY;

  if (!openai_key) {
    console.error("ERROR: No API key found in environment variables");
    console.error("Available environment variables:", Object.keys(process.env).join(', '));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'OpenAI API key not configured. Check function logs for details.' })
    };
  }

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

  // Extract attached image if present
  const attachedImage = data.attachedImage;

  // Check if this is a follow-up conversation (has system responses but no attachedImage)
  const isFollowUpConversation = !attachedImage && messagesData.some(m => m.role === 'system');

  // Custom prompt for image identification
  const custom_prompt = `You are a specialized car, truck, and motorcycle identification assistant. You ONLY analyze and discuss cars, trucks, or motorcycles in images. ${isFollowUpConversation ? 'You are continuing a conversation about a vehicle that was shown in a previous image. Answer follow-up questions about that vehicle based on the conversation context.' : 'You MUST receive an image to respond and the image MUST contain a car, truck, or motorcycle. If no image is provided, respond with this exact string: "Please provide an image of a vehicle for me to analyze."'} If the image contains none of these, respond with this exact string: "I can only analyze vehicles. Please provide an image that contains one." If the image contains other objects along with a vehicle, focus EXCLUSIVELY on the car, truck, or motorcycle. NEVER discuss anything other than cars, trucks, motorcycles, vehicles, or automotive topics.

  Always respond with a pure JSON object - Do NOT include markdown formatting, triple backticks, or any code blocks.
  The object MUST include a "message" string key at all times.
  If an image was provided and recognized, ALSO include a "title" string key with less than 5 words describing the vehicle.
  If no image was provided, omit "title" entirely.
  NEVER respond with a bare string.
  
  Identify the make, model, year if possible, and provide relevant automotive details such as features, specifications, or interesting facts about that particular vehicle.`

  // Prepare messages array for OpenAI
  const messages = [
    {
      role: "system",
      content: custom_prompt
    }
  ];

  const hasOriginalImage = isFollowUpConversation && messagesData.length > 0;

  // Process each message from the iOS app
  messagesData.forEach((msg, index) => {
    const openai_message = {
      role: msg.role === 'user' ? 'user' : 'assistant'
    };
    
    // Check if this is the first user message
    const isFirstUserMessage = msg.role === 'user' && !messagesData.slice(0, index).some(m => m.role === 'user');
    const shouldIncludeImage = isFirstUserMessage && attachedImage && attachedImage.trim() !== '';
    
    // For follow-up conversations, assume the first user message originally had an image
    const shouldIncludeImageForFollowUp = isFirstUserMessage && hasOriginalImage;
    
    if (shouldIncludeImage) {
      // First user message with attached image (new conversation)
      const content = [];
      
      // Add text if present
      if (msg.message && msg.message.trim() !== '') {
        content.push({
          type: "text",
          text: msg.message
        });
      }
      
      // Add attached image
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${attachedImage}`
        }
      });
      
      openai_message.content = content;
    } else if (shouldIncludeImageForFollowUp) {
      // First user message in follow-up conversation (maintain context)
      const content = [];
      
      // Add text if present
      if (msg.message && msg.message.trim() !== '') {
        content.push({
          type: "text",
          text: msg.message
        });
      }
      
      // Add placeholder for image context (OpenAI will know there was an image)
      content.push({
        type: "text",
        text: "[Image was provided in previous context]"
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

    const rawContent = openaiResponse.choices[0].message.content;
    const responseBody = processResponse(rawContent);

    return {
      statusCode: 200,
      headers,
      body: responseBody
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