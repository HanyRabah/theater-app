import { addClient, removeClient } from '@/app/lib/sse';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      addClient(controller);

      // Send initial keepalive
      controller.enqueue(new TextEncoder().encode('data: keepalive\n\n'));

      // Send keepalive every 30 seconds
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode('data: keepalive\n\n'));
        } catch (error) {
          clearInterval(keepaliveInterval);
        }
      }, 30000);

      return () => {
        clearInterval(keepaliveInterval);
      };
    },
    cancel() {
      removeClient(controller);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}