// Configuration
const POCKETBASE_URL = 'https://fierylion.pockethost.io';
const REQUEST_THRESHOLD = 20;
const CHECK_INTERVAL = 5 * 60; // 5 minutes in seconds
const ADMIN_EMAIL = 'fierylionite@gmail.com';
const ADMIN_PASSWORD = 'Hope810115';

addEventListener('scheduled', event => {
  event.waitUntil(handleScheduled(event.scheduledTime));
});

// For testing via HTTP request
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    await monitorRequests();
    return new Response('Request monitoring completed successfully', { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleScheduled(scheduledTime) {
  try {
    console.log('Starting scheduled request monitoring at:', new Date(scheduledTime).toISOString());
    await monitorRequests();
    console.log('Completed scheduled request monitoring');
  } catch (error) {
    console.error('Error in scheduled task:', error);
  }
}

async function monitorRequests() {
  // Get timestamp for 5 minutes ago
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  console.log('Checking requests since:', fiveMinutesAgo);

  // Authenticate as admin
  let authData;
  try {
    const authResponse = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication failed with status ${authResponse.status}`);
    }

    authData = await authResponse.json();
    if (!authData.token) {
      throw new Error('No authentication token received');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Failed to authenticate with PocketBase');
  }

  // Get all requests from the last 5 minutes
  let requestsResponse;
  try {
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/requests/records?filter=(created>='${fiveMinutesAgo}')`,
      {
        headers: {
          'Authorization': authData.token
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch requests with status ${response.status}`);
    }

    requestsResponse = await response.json();
    console.log(`Found ${requestsResponse.items.length} requests in the last 5 minutes`);
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw new Error('Failed to fetch recent requests');
  }

  // Count requests per user
  const userRequestCounts = {};
  for (const request of requestsResponse.items) {
    const userId = request.requester;
    userRequestCounts[userId] = (userRequestCounts[userId] || 0) + 1;
  }

  // Check each user's request count and update status if needed
  for (const [userId, requestCount] of Object.entries(userRequestCounts)) {
    try {
      // Get current user status
      const userResponse = await fetch(
        `${POCKETBASE_URL}/api/collections/users/records/${userId}`,
        {
          headers: {
            'Authorization': authData.token
          }
        }
      );

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user ${userId} with status ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      let newStatus = userData.status;

      // If requests > threshold*2, immediately suspend
      if (requestCount > REQUEST_THRESHOLD * 2) {
        newStatus = 'suspended';
        console.log(`User ${userId} exceeded ${REQUEST_THRESHOLD * 2} requests. Setting status to suspended.`);
      }
      // If requests > threshold, flag or suspend based on current status
      else if (requestCount > REQUEST_THRESHOLD) {
        newStatus = userData.status === 'flagged' ? 'suspended' : 'flagged';
        console.log(`User ${userId} exceeded ${REQUEST_THRESHOLD} requests. Setting status to ${newStatus}.`);
      }

      // Update user status if it changed
      if (newStatus !== userData.status) {
        const updateResponse = await fetch(
          `${POCKETBASE_URL}/api/collections/users/records/${userId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': authData.token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: newStatus
            })
          }
        );

        if (!updateResponse.ok) {
          throw new Error(`Failed to update user ${userId} status with status ${updateResponse.status}`);
        }

        console.log(`Successfully updated user ${userId} status to ${newStatus}`);
      }
    } catch (error) {
      console.error(`Error processing user ${userId}:`, error);
      // Continue processing other users even if one fails
      continue;
    }
  }
}
