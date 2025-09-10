import { httpAction, internalAction } from "./_generated/server"
import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { UserWebhookEvent } from "@clerk/backend";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || ``

async function validateRequest(request: Request) {
  const payloadString = await request.text()
  const headerPayload = request.headers;

  const svixHeaders = {
    'svix-id': headerPayload.get('svix-id')!,
    'svix-timestamp': headerPayload.get('svix-timestamp')!,
    'svix-signature': headerPayload.get('svix-signature')!,
  }

  const wh = new Webhook(webhookSecret)

  return wh.verify(payloadString, svixHeaders) as UserWebhookEvent
}


// define the webhook handler
const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateRequest(request)

  if (!event) {
    return new Response('Error occured', { status: 400 })
  }

  console.log('event', event);

  switch (event.type) {
    case 'user.created': {
      await ctx.runMutation(internal.users.upsertUser, {
        clerkId: event.data.id,
        email: event.data.email_addresses[0]?.email_address || '',
        firstName: event.data.first_name || '',
        lastName: event.data.last_name || '',
        imageUrl: event.data.image_url || '',
      })
      break
    }
    case 'user.updated': {
      await ctx.runMutation(internal.users.upsertUser, {
        clerkId: event.data.id,
        email: event.data.email_addresses[0]?.email_address || '',
        firstName: event.data.first_name || '',
        lastName: event.data.last_name || '',
        imageUrl: event.data.image_url || '',
      })
      break
    }
    case 'user.deleted': {
      const id = event.data.id!
      await ctx.runMutation(internal.users.deleteUser, { clerkId: id })
      break
    }
    default: {
      console.log('ignored Clerk user webhook event');
    }
  }

  return new Response(null, { status: 200 })
});

// define the http router
const http = httpRouter()

// define the webhook route
http.route({
  path: '/clerk-users-webhook',
  method: 'POST',
  handler: handleClerkWebhook,
})

export default http;