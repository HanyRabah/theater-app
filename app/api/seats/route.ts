// api/seats/route.ts
import { sendUpdateToClients } from '@/app/lib/sse';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const seats = await prisma.seat.findMany();
    return NextResponse.json(seats);
  } catch {
    return NextResponse.json({ error: 'Error fetching seats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.row || !body.number || !body.section || !body.block) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { row, number, section, block, name } = body;
    
    const seat = await prisma.seat.upsert({
      where: {
        row_number_section_block: {
          row,
          number,
          section,
          block,
        },
      },
      update: {
        name,
      },
      create: {
        row,
        number,
        section,
        block,
        name,
      },
    });

    // Send update to all connected clients
    await sendUpdateToClients({
      type: 'SEAT_UPDATE',
      seat
    });

    return NextResponse.json({ success: true, seat });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { row, number, section, block } = body;
    
   const deletedSeat = await prisma.seat.delete({
      where: {
        row_number_section_block: {
          row,
          number,
          section,
          block,
        },
      },
    });

    // Send update for deletion
    sendUpdateToClients({
      type: 'SEAT_UPDATE',
      seat: { ...deletedSeat, name: null }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting seat:', error);
    return NextResponse.json({ error: 'Error deleting seat' }, { status: 500 });
  }
}