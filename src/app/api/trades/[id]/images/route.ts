import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: tradeId } = await params;

    // Verify trade belongs to user
    const trade = await prisma.trade.findFirst({
      where: { id: tradeId, userId: session.id },
    });
    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 });

    const images = await prisma.tradeImage.findMany({
      where: { tradeId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, images });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: tradeId } = await params;

    // Verify trade belongs to user
    const trade = await prisma.trade.findFirst({
      where: { id: tradeId, userId: session.id },
    });
    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 });

    // Check existing image count (max 3)
    const existingCount = await prisma.tradeImage.count({ where: { tradeId } });
    if (existingCount >= 3) {
      return NextResponse.json({ error: 'Maximum 3 images per trade' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const label = (formData.get('label') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WebP, or GIF.' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${session.id}_${tradeId}_${randomUUID()}.${ext}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'trades');
    await mkdir(uploadsDir, { recursive: true });

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadsDir, filename), buffer);

    // Save metadata to DB
    const image = await prisma.tradeImage.create({
      data: {
        tradeId,
        filename,
        label,
      },
    });

    return NextResponse.json({ success: true, image });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: tradeId } = await params;
    const url = new URL(req.url);
    const imageId = url.searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'imageId required' }, { status: 400 });
    }

    // Verify trade belongs to user
    const trade = await prisma.trade.findFirst({
      where: { id: tradeId, userId: session.id },
    });
    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 });

    // Delete image record (file cleanup is optional, could be a cron job)
    await prisma.tradeImage.delete({ where: { id: imageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
