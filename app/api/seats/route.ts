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
    
    return NextResponse.json(seat);
  } catch {
    return NextResponse.json({ error: 'Error saving seat' }, { status: 500 });
  }
}