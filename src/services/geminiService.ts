import { Type } from '@google/genai';
import { BreakSlot, DraftResult, Sentiment, CaptainRequestResult, GrammarCheckResult, TermMeaningResult } from '../types';
import { generateWithFallback, generateStreamWithFallback } from './geminiClient';
import { getAI } from './geminiClient';
import { TollRulesFormatter } from '../config/tolls';

export async function generateDraft(
  summaryInput: string,
  draftInput: string,
  tone: 'Professional' | 'Empathy Professional' = 'Professional',
  language: 'English' | 'Arabic' = 'English',
  replyTo: 'Customer' | 'Driver' | 'Both' = 'Both',
  replyLength: string = 'Auto',
  agentName: string = '',
  company: string = 'Yango',
  includeGreeting: boolean = true,
  includeEnding: boolean = true
): Promise<DraftResult> {
  const ai = getAI();

  const greetingTemplate = language === 'Arabic' 
    ? `مرحباً،\n\nشكراً لتواصلك معنا. أنا [AGENT_NAME] من فريق دعم [COMPANY_NAME]، ويسعدني مساعدتك في حل مشكلتك.`
    : `Hi,\n\nThank you for contacting us. I'm [AGENT_NAME] from the [COMPANY_NAME] support team, and I'm happy to help you with your problem.`;

  const closingTemplate = language === 'Arabic'
    ? `إذا احتجت أي مساعدة إضافية، فلا تتردد في التواصل معنا في أي وقت.\n\nشكراً لتواصلك مع خدمة عملاء [COMPANY_NAME]! نرجو منك التكرم بتقييم تجربتك معنا في هذه الدردشة (حيث 5 هو التقييم الأعلى). ملاحظاتك تهمنا جداً وتساعدنا على تقديم خدمة أفضل لك دائماً.\n\nنتمنى لك يوماً سعيداً!`
    : `If you need any further assistance, please don't hesitate to reach out to us.\n\nThank you for contacting [COMPANY_NAME] customer support! We would greatly appreciate it if you could rate your experience with us in this chat (5 being the highest). Your feedback is incredibly valuable and helps us serve you better.\n\nHave a wonderful day!`;

  const prompt = `
    You are an elite, world-class Customer Support Specialist. Your goal is to draft the perfect, most effective response that maximizes Customer Satisfaction (CSAT) and resolves the issue efficiently.

    === INPUT CONTEXT ===
    Conversation History: "${summaryInput}"
    ${draftInput ? `Required Resolution/Action Points (You MUST include these in your reply): "${draftInput}"` : 'No specific resolution points provided. Infer the best standard support response based on the conversation.'}
    Target Audience: ${replyTo}
    Tone: ${tone}
    Language: ${language}
    ${agentName ? `Agent Name: ${agentName}` : ''}
    Company: ${company}
    ${replyLength !== 'Auto' ? `Length Constraint: Exactly ${replyLength} sentences (excluding the greeting and closing).` : ''}

    === TASKS ===
    Task 1: Analyze the customer's sentiment (Angry, Neutral, Happy, Confused, Urgent).
    Task 2: Create a concise, 6-word max summary of the core issue.
    ${replyTo === 'Customer' || replyTo === 'Both' ? `Task 3: Write TWO distinct, highly polished responses to the CUSTOMER.` : `Task 3: Return an empty array [] for CUSTOMER responses.`}
    ${replyTo === 'Driver' || replyTo === 'Both' ? `Task 4: Write TWO distinct, highly polished, clear, and directive responses to the DRIVER.` : `Task 4: Return an empty array [] for DRIVER responses.`}

    === CRITICAL GUIDELINES FOR REPLIES ===
    1. DIRECT COMMUNICATION (NO INSTRUCTIONS):
       - You are writing the EXACT message the support agent will copy and paste to the recipient.
       - DO NOT write instructions for the agent (e.g., do NOT write "Inform the driver to..." or "Tell the customer that...").
       - Write directly TO the recipient using "you" (e.g., "Please restart your app...").
       - Use "I" or "we" to refer to the support team.
    2. STRUCTURE & FORMATTING (MANDATORY):
       - DO NOT write a single block of text. You MUST use paragraph breaks (empty lines) to separate sections.
       - SPACING RULE: You MUST leave a blank empty line between the Greeting, the Body, and the Closing.
       ${includeGreeting ? `- Greeting: Start in a NEW paragraph using the following greeting template. You MUST replace [AGENT_NAME] and [COMPANY_NAME] with the agent's name ("${agentName || 'the agent'}") and company ("${company}"), properly and naturally translating them into ${language} (Note: if the company is "Yango" and the language is Arabic, it MUST be written as "يانجو"):\n         "${greetingTemplate}"\n\n` : '- Greeting: DO NOT include any greeting or introduction. Start directly with the acknowledgment.'}
       - Acknowledge & Validate: In a NEW paragraph, briefly acknowledge their specific situation and apologize if appropriate (e.g., "I am sorry to hear you are not receiving bookings.").
       - Resolve: In a NEW paragraph, clearly deliver the solution using the "Required Resolution/Action Points". Explain the "why" if provided. Use bullet points if there are multiple steps.
       ${includeEnding ? `\n\n       - Close: End in a NEW paragraph using the following closing template. You MUST replace [COMPANY_NAME] with the company ("${company}"), properly translated into ${language} (Note: if the company is "Yango" and the language is Arabic, it MUST be written as "يانجو"):\n         "${closingTemplate}"` : '- Close: DO NOT include any closing message, sign-off, or ending. End immediately after the resolution.'}
    3. TONE RULES:
       - Sound HUMAN, natural, and conversational. Avoid robotic phrases like "rectify this situation" or "prompt cooperation". Use simple, friendly language.
       - "Professional": Direct, clear, polite, and solution-oriented.
       - "Empathy Professional": Warm, understanding, and highly apologetic if something went wrong. Validate their feelings before giving the solution.
    4. PERSONALIZATION: Use specific details from the conversation so it doesn't sound generic. DO NOT just parrot the conversation back.
    5. DRIVER REPLIES: If writing to a driver, be extremely clear, directive, and respectful. Use bullet points if helpful. Remember, write DIRECTLY to the driver.
    6. LANGUAGE: All replies MUST be written in ${language}.
    ${replyLength !== 'Auto' ? `7. LENGTH: You MUST write EXACTLY ${replyLength} sentences for the main body (excluding the provided greeting and closing). Count your punctuation marks carefully.` : '7. LENGTH: Keep it concise but well-structured.'}
    8. DO NOT REPEAT WORDS: Do NOT repeat the exact words or phrases used by the rider or driver. Rephrase and summarize their issue professionally.
    9. NO BLAME: Do NOT blame the company (${company}) or its systems/policies for the issue under any circumstances. Take ownership politely without pointing fingers.
  `;

  const response = await generateWithFallback({
    contents: prompt,
    jsonSchema: {
      type: Type.OBJECT,
      properties: {
        sentiment: {
          type: Type.STRING,
          description: 'The sentiment of the customer message. Must be one of: Angry, Neutral, Happy, Confused, Urgent.',
        },
        summary: {
          type: Type.STRING,
          description: 'A short title summarizing the issue (max 6 words).',
        },
        responses: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Two different professional, empathetic, and clear responses to the user.',
        },
        driverResponses: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Two different professional, empathetic, and clear responses to the driver.',
        },
      },
      required: ['sentiment', 'summary', 'responses', 'driverResponses'],
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error('Failed to generate draft.');
  }

  let result: any;
  try {
    result = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error('Failed to parse response from AI.');
  }

  if (!result.responses || !Array.isArray(result.responses)) {
    result.responses = result.response ? [result.response, result.response] : ["Could not generate response.", "Please try again."];
  }
  if (!result.driverResponses || !Array.isArray(result.driverResponses)) {
    result.driverResponses = ["Could not generate driver response.", "Please try again."];
  }

  return result as DraftResult;
}

export async function detectLanguage(text: string): Promise<string> {
  const prompt = `Identify the language of the following text. Respond with ONLY the name of the language in English (e.g., "English", "Arabic", "Spanish", etc.) and nothing else.\n\nText: "${text}"`;
  
  const response = await generateWithFallback({
    contents: prompt,
    config: { temperature: 0.1 }
  });
  
  return response?.text?.trim() || 'Unknown Language';
}

export async function translateText(text: string, targetLanguage: string, onChunk?: (text: string) => void, image?: { data: string, mimeType: string }): Promise<string> {
  const prompt = `Translate the following text into ${targetLanguage}: \n\n${text}`;
  
  const contents: any = {
    parts: [
      { text: prompt }
    ]
  };

  if (image) {
    contents.parts.unshift({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    });
  }

  if (onChunk) {
    return await generateStreamWithFallback({
      contents,
      onChunk
    });
  }

  const response = await generateWithFallback({ contents });
  return response?.text || '';
}

export async function generateCaptainRequest(input: string): Promise<CaptainRequestResult> {
  const ai = getAI();
  const prompt = `
    You are an expert Customer Support Agent preparing an escalation request for your team captain/manager.
    The user provided the following text (which may contain a customer message, notes, and possibly a ticket link):
    "${input}"
    
    Extract and generate the following information:
    1. ticketLink: Any URL or ticket ID found in the text. If none, leave empty.
    2. summary: A concise summary of the customer's issue.
    3. validation: What the agent has already checked or validated based on the text. If not explicitly stated, infer what basic troubleshooting steps would have been taken or state what is known.
    4. needsFromCaptain: What specifically the agent needs the captain to do (e.g., approve a refund, check backend logs, provide guidance).
  `;

  const response = await generateWithFallback({
    contents: prompt,
    jsonSchema: {
      type: Type.OBJECT,
      properties: {
        ticketLink: { type: Type.STRING },
        summary: { type: Type.STRING },
        validation: { type: Type.STRING },
        needsFromCaptain: { type: Type.STRING },
      },
      required: ['ticketLink', 'summary', 'validation', 'needsFromCaptain'],
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error('Failed to generate captain request.');
  }

  try {
    return JSON.parse(text) as CaptainRequestResult;
  } catch (e) {
    console.error("Failed to parse JSON for captain request:", text);
    throw new Error('Failed to parse response from AI.');
  }
}

export async function extractRouteDetailsFromImage(image: { data: string, mimeType: string }): Promise<{ pickup: string, dropoff: string } | null> {
  const prompt = `Analyze this map screenshot. Extract the "pick-up" (origin) location and the "drop-off" (destination) location.
Return the result strictly as a JSON object with two keys: "pickup" and "dropoff". Do not use markdown backticks for the JSON.
Example:
{"pickup": "Dubai Marina", "dropoff": "Abu Dhabi Airport"}
`;
  
  try {
    const response = await generateWithFallback({
      contents: [
        {
          inlineData: {
            data: image.data,
            mimeType: image.mimeType
          }
        },
        prompt
      ],
      config: { temperature: 0.1 }
    });
    
    if (!response || !response.text) return null;
    
    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json/g, '');
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```/g, '');
    jsonStr = jsonStr.trim();
    
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to extract route details:", err);
    return null;
  }
}

export async function generateTollEstimate(
  pickup: string, 
  dropoff: string, 
  time: string, 
  image?: { data: string, mimeType: string } | null, 
  onChunk?: (text: string) => void
): Promise<string> {
  const allTollRules = TollRulesFormatter.getAllRulesText();
  
  let prompt = `
    You are an expert on UAE toll gates.
    A user wants to travel from "${pickup}" to "${dropoff}" at "${time}".
    
    Based on typical routes between these locations, estimate:
    1. The typical route or track taken between these two locations.
    2. Which specific toll gates they are likely to cross along this track.
    3. The estimated total cost in AED.
    
    Here are the current rules for all the UAE Toll Systems:
    
    ${allTollRules}
  `;

  if (image) {
    prompt += `\nI have also attached a screenshot of the route I am taking. Please use this screenshot to precisely determine which toll gates I am passing through based on the highlighted path.\n`;
  }

  prompt += `\nProvide a clear, concise, and professional summary of the expected toll gates and the total cost. Format it nicely using Markdown.`;

  const contents: any = {
    parts: [{ text: prompt }]
  };

  if (image) {
    contents.parts.unshift({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      }
    });
  }

  if (onChunk) {
    return await generateStreamWithFallback({
      contents,
      onChunk
    });
  }

  const response = await generateWithFallback({ contents });
  return response?.text || 'Could not generate toll estimate.';
}

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
  const ai = getAI();
  const prompt = `
    You are an expert transcriptionist.
    Please transcribe the following audio message accurately.
    The language might be English (including Indian, Pakistani, or Native accents), Urdu, or Arabic (including non-native speakers).
    
    If the audio is in English, provide the exact transcription.
    If the audio is in Urdu or Arabic, provide the transcription in the original language, followed by an English translation.
    
    Format the output clearly.
  `;

  const audioPart = {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };

  const textPart = {
    text: prompt,
  };

  const response = await generateWithFallback({
    contents: { parts: [audioPart, textPart] }
  });

  return response?.text || 'Could not transcribe audio.';
}

export async function rephraseText(text: string, tone: string, onChunk?: (text: string) => void): Promise<string> {
  const ai = getAI();
  const prompt = `
    You are an expert copywriter and editor.
    Please rephrase the following text to have a "${tone}" tone.
    
    Original Text:
    "${text}"
    
    Provide ONLY the rephrased text. Do not include any introductory or concluding remarks.
  `;
  
  const contents: any = {
    parts: [
      { text: prompt }
    ]
  };

  if (onChunk) {
    return await generateStreamWithFallback({
      contents,
      onChunk
    });
  }

  const response = await generateWithFallback({ contents });
  return response?.text || '';
}


export async function checkGrammar(text: string, language: string = 'English', tone: string = 'Neutral'): Promise<GrammarCheckResult> {
  const ai = getAI();
  const prompt = `
    You are an expert proofreader and editor.
    Review the following ${language} text for grammar, punctuation, spelling, and clarity.
    Text to check: "${text}"
    
    ${tone !== 'Neutral' ? `CRITICAL: Rewrite the text to sound more ${tone}. Ensure the final text matches this tone while keeping the original meaning.` : ''}
    
    Provide the fully corrected text. Also, provide a list of specific changes made and a brief explanation for each.
    If the text is already perfect and matches the requested tone, return the original text and an empty changes array.
  `;

  const response = await generateWithFallback({
    contents: prompt,
    jsonSchema: {
      type: Type.OBJECT,
      properties: {
        correctedText: { type: Type.STRING },
        changes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              corrected: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ['original', 'corrected', 'explanation']
          }
        }
      },
      required: ['correctedText', 'changes']
    }
  });

  const responseText = response?.text;
  if (!responseText) throw new Error('Failed to check grammar.');
  
  try {
    return JSON.parse(responseText) as GrammarCheckResult;
  } catch (e) {
    console.error("Failed to parse JSON for grammar check:", responseText);
    throw new Error('Failed to parse response from AI.');
  }
}

export async function parseBreakSchedule(text: string): Promise<BreakSlot[]> {
  const ai = getAI();
  const prompt = `
    Parse the following text and extract all break schedules. 
    Return a JSON array of objects. Each object must have these exact keys:
    - "startTime": string in 24-hour format "HH:MM"
    - "endTime": string in 24-hour format "HH:MM"
    - "durationMinutes": number (the duration in minutes)
    - "type": string (e.g., "Lunch", "Short Break", or "Break" if unspecified)
    
    If you cannot parse any breaks, return an empty array [].
    
    Text:
    "${text}"
  `;

  const response = await generateWithFallback({
    contents: prompt,
    jsonSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          startTime: { type: Type.STRING },
          endTime: { type: Type.STRING },
          durationMinutes: { type: Type.INTEGER },
          type: { type: Type.STRING }
        },
        required: ['startTime', 'endTime', 'durationMinutes', 'type']
      }
    }
  });

  const responseText = response?.text;
  if (!responseText) throw new Error('Failed to parse breaks.');
  
  try {
    const rawBreaks = JSON.parse(responseText);
    // Ensure every break has a unique id
    return rawBreaks.map((b: any, index: number) => ({
      ...b,
      id: `break-${Date.now()}-${index}`
    })) as BreakSlot[];
  } catch (e) {
    console.error("Failed to parse JSON for breaks:", responseText);
    throw new Error('Failed to parse response from AI.');
  }
}

export async function generateMacroTranslations(text: string): Promise<{ english: string, arabic: string }> {
  const prompt = `
    You are an expert translator. The following text may be in English, Arabic, or another language.
    Translate or rewrite it so you provide both a perfect English version and a perfect Arabic version.
    
    Text: "${text}"
    
    Return a JSON object with two keys:
    - "english": The English version of the text.
    - "arabic": The Arabic version of the text.

    Always return valid JSON without any markdown formatting.
  `;

  const response = await generateWithFallback({
    contents: prompt,
    config: { temperature: 0.2 },
    jsonSchema: {
      type: Type.OBJECT,
      properties: {
        english: { type: Type.STRING },
        arabic: { type: Type.STRING },
      },
      required: ['english', 'arabic']
    }
  });

  const responseText = response?.text;
  if (!responseText) {
    throw new Error('No response received from Gemini.');
  }

  try {
    return JSON.parse(responseText) as { english: string, arabic: string };
  } catch (error) {
    console.error("Failed to parse JSON for macro translations assessment:", responseText);
    throw new Error('Failed to parse response from AI.');
  }
}

export async function analyzeRideHailingTerm(text: string): Promise<TermMeaningResult> {
  const sanitizeSensitiveData = (input: string) => {
    let result = input;
    // Emails
    result = result.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    // Card numbers (13-19 digits with optional spaces/dashes)
    result = result.replace(/\b(?:\d[ \-]*?){13,19}\b/g, '[CARD]');
    // Phone numbers (simplistic: + followed by 7-15 digits, or 10-15 digits)
    result = result.replace(/(?:\+?\d{1,4}[ \-]?)?(?:\(?\d{2,5}\)?[ \-]?)?\d{3,4}[ \-]?\d{3,4}(?:[ \-]?\d{2,4})?/g, (match) => {
      const digitCount = match.replace(/\D/g, '').length;
      if (digitCount >= 7 && digitCount <= 19) {
        return '[PHONE/NUMBER]';
      }
      return match;
    });
    return result;
  };

  const sanitizedText = sanitizeSensitiveData(text);

  const ai = getAI();
  const prompt = `
    You are an expert in the ride-hailing industry (like Uber, Lyft, Bolt, Yango, InDrive, Yandex, etc.). 
    A customer or driver has used the following term or phrase:
    "${sanitizedText}"
    
    Your task is to explain what this phrase or term means in the context of ride-hailing.
    Return a JSON object with the following exact keys:
    - "englishMeaning": A clear, concise explanation of the term in English. If the term is unclear, state "Unclear / Needs context".
    - "arabicMeaning": A clear, concise explanation of the term in Arabic. If the term is unclear, state "غير واضح / يحتاج إلى سياق".
    - "isUnclear": boolean. Set to true if the text is completely incomprehensible, lacks any ride-hailing context, or you simply don't know what it means.

    Always return valid JSON without any markdown formatting.
  `;

  const response = await generateWithFallback({
    contents: prompt,
    config: { temperature: 0.2 },
    jsonSchema: {
      type: Type.OBJECT,
      properties: {
        englishMeaning: { type: Type.STRING },
        arabicMeaning: { type: Type.STRING },
        isUnclear: { type: Type.BOOLEAN },
      },
      required: ['englishMeaning', 'arabicMeaning', 'isUnclear']
    }
  });

  const responseText = response?.text;
  if (!responseText) {
    throw new Error('No response received from Gemini.');
  }

  try {
    return JSON.parse(responseText) as TermMeaningResult;
  } catch (error) {
    console.error("Failed to parse JSON for ride-hailing term assessment:", responseText);
    throw new Error('Failed to parse response from AI.');
  }
}
