import type { OrganizeOptions } from '@/types';
import { organize } from '@/lib/organizer';

export async function POST(request: Request) {
  const options = await request.json() as OrganizeOptions;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await organize(options, (islenen, toplam, dosya) => {
          send({ islenen, toplam, dosya });
        });
        send({ done: true, result });
      } catch (err) {
        send({ hata: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
