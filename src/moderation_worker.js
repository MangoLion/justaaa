// src/moderation_worker.js
export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    if (request.method === "POST") {
      try {
        // Parse incoming request
        const data = await request.json();
        const { text, image_url } = data;

        // Prepare moderation request payload
        const moderationPayload = {
          model: "omni-moderation-latest",
          input: []
        };

        // Add text input if provided
        if (text) {
          moderationPayload.input.push({
            type: "text",
            text: text
          });
        }

        // Add image input if provided
        if (image_url) {
          moderationPayload.input.push({
            type: "image_url",
            image_url: {
              url: image_url
            }
          });
        }

        // Call OpenAI Moderation API
        const moderationResponse = await fetch("https://api.openai.com/v1/moderations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify(moderationPayload)
        });

        if (!moderationResponse.ok) {
          throw new Error(`OpenAI API error: ${moderationResponse.status}`);
        }

        const moderationResult = await moderationResponse.json();

        // Return moderation results with CORS headers
        return new Response(JSON.stringify(moderationResult), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });

      } catch (error) {
        // Return error response with CORS headers
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    // Handle unsupported methods
    return new Response("Method Not Allowed", { 
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
