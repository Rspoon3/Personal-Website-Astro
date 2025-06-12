// netlify/functions/openai-proxyV3.js
//
// To run locally:
// 1. cd /Users/richardwitherspoon/Documents/Personal-Website-Astro
// 2. netlify dev (starts Netlify functions on localhost:8888)
// 3. Update iOS app ConversationService proxyURL to: http://localhost:8888/.netlify/functions/openai_proxyV3
// 4. Make sure OPENAI_API_KEY is set in .env file

import { processResponse } from '../helpers/response_parser.js';
import { verifyHMAC } from '../helpers/auth_hmac.js';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const createResponse = (statusCode, body = '') => ({
  statusCode,
  headers: HEADERS,
  body: typeof body === 'string' ? body : JSON.stringify(body)
});

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200);
  }

  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  const authCheck = verifyHMAC(event.headers);
  if (!authCheck.ok) {
    return createResponse(authCheck.code, { error: authCheck.reason });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error("ERROR: No API key found in environment variables");
    console.error("Available environment variables:", Object.keys(process.env).join(', '));
    return createResponse(500, { error: 'OpenAI API key not configured. Check function logs for details.' });
  }

  let data, messagesData;
  
  try {
    data = JSON.parse(event.body || '{}');
    if (!data.messages) {
      return createResponse(400, { error: 'Missing required field: messages' });
    }
    messagesData = JSON.parse(data.messages);
  } catch (error) {
    const errorMsg = error.message.includes('messages') ? 'Invalid messages data' : 'Invalid JSON data';
    return createResponse(400, { error: errorMsg });
  }

  const { attachedImage } = data;
  const isFollowUpConversation = !attachedImage && messagesData.some(m => m.role === 'system');

  const PROMPTS = {
    base: 'You are a specialized car, truck, and motorcycle identification assistant. You ONLY analyze and discuss cars, trucks, or motorcycles in images.',
    followUp: 'You are continuing a conversation about a vehicle that was shown in a previous image. Answer follow-up questions about that vehicle based on the conversation context.',
    newConversation: 'You MUST receive an image to respond and the image MUST contain a car, truck, or motorcycle. If no image is provided, respond with this exact string: "Please provide an image of a vehicle for me to analyze."',
    validation: 'If the image contains none of these, respond with this exact string: "I can only analyze vehicles. Please provide an image that contains one." If the image contains other objects along with a vehicle, focus EXCLUSIVELY on the car, truck, or motorcycle. NEVER discuss anything other than cars, trucks, motorcycles, vehicles, or automotive topics.',
    format: 'Always respond with a pure JSON object - Do NOT include markdown formatting, triple backticks, or any code blocks. The object MUST include a "message" string key at all times. If an image was provided and recognized, ALSO include a "title" string key with less than 5 words describing the vehicle. If no image was provided, omit "title" entirely. NEVER respond with a bare string. Identify the make, model, year if possible, and provide relevant automotive details such as features, specifications, or interesting facts about that particular vehicle.'
  };
  
  const systemPrompt = `${PROMPTS.base} ${isFollowUpConversation ? PROMPTS.followUp : PROMPTS.newConversation} ${PROMPTS.validation} ${PROMPTS.format}`;

  const messages = [{ role: 'system', content: systemPrompt }];
  const hasOriginalImage = isFollowUpConversation && messagesData.length > 0;
  let firstUserMessageProcessed = false;

  const processMessage = (msg) => {
    const openaiMessage = { role: msg.role === 'user' ? 'user' : 'assistant' };
    const isFirstUserMessage = msg.role === 'user' && !firstUserMessageProcessed;
    
    if (isFirstUserMessage) {
      firstUserMessageProcessed = true;
      const content = [];
      
      if (msg.message?.trim()) {
        content.push({ type: 'text', text: msg.message });
      }
      
      if (attachedImage?.trim()) {
        content.push({
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${attachedImage}` }
        });
      } else if (hasOriginalImage) {
        content.push({ type: 'text', text: '[Image was provided in previous context]' });
      }
      
      openaiMessage.content = content.length > 0 ? content : (msg.message || '');
    } else {
      openaiMessage.content = msg.message || '';
    }
    
    return openaiMessage;
  };

  messages.push(...messagesData.map(processMessage));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      return createResponse(response.status, await response.text());
    }

    const openaiResponse = await response.json();
    const choice = openaiResponse?.choices?.[0];
    
    if (!choice?.message) {
      return createResponse(500, { error: 'Invalid response from OpenAI' });
    }

    return createResponse(200, processResponse(choice.message.content));
   
  } catch (error) {
    console.error('Request failed:', error);
    return createResponse(500, { error: `Request failed: ${error.message}` });
  }
};