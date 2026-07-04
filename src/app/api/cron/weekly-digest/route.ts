import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  try {
    // Basic protection against unauthorized calls
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine the date range (last 7 days)
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch users who are verified and opted into weekly digests
    const users = await prisma.user.findMany({
      where: {
        emailVerified: true,
        weeklyDigestEnabled: true
      },
      select: { id: true, name: true, email: true }
    });

    if (users.length === 0) {
      return NextResponse.json({ success: true, message: 'No eligible users found' });
    }

    const results = [];

    // Process in batches if necessary, but sequentially for simplicity in this prototype
    for (const user of users) {
      // Find closed trades in the last 7 days
      const trades = await prisma.trade.findMany({
        where: {
          userId: user.id,
          status: 'Closed',
          exitDate: {
            gte: lastWeek,
            lte: now
          },
          pnl: { not: null }
        },
        orderBy: { exitDate: 'desc' }
      });

      if (trades.length === 0) {
        continue; // Skip users with no trades this week
      }

      // Calculate stats
      let totalPnl = 0;
      let wins = 0;
      let bestTrade = trades[0];
      let worstTrade = trades[0];

      for (const t of trades) {
        totalPnl += t.pnl!;
        if (t.pnl! > 0) wins++;
        
        if (t.pnl! > bestTrade.pnl!) bestTrade = t;
        if (t.pnl! < worstTrade.pnl!) worstTrade = t;
      }

      const winRate = ((wins / trades.length) * 100).toFixed(1);
      const isProfitable = totalPnl >= 0;

      // Construct HTML Email
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #111;">OneCandle Weekly Digest</h2>
            <p style="color: #666; font-size: 14px;">Here is your trading summary for the past 7 days.</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="margin-top: 0; color: #333;">Hello, ${user.name}!</h3>
            
            <div style="display: flex; justify-content: space-between; margin-top: 20px; margin-bottom: 30px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 120px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center; margin: 5px;">
                <div style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold;">Weekly P&L</div>
                <div style="font-size: 24px; font-weight: bold; color: ${isProfitable ? '#52A49A' : '#DD5E56'}; margin-top: 8px;">
                  ${isProfitable ? '+' : ''}$${Math.abs(totalPnl).toFixed(2)}
                </div>
              </div>
              <div style="flex: 1; min-width: 120px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center; margin: 5px;">
                <div style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold;">Win Rate</div>
                <div style="font-size: 24px; font-weight: bold; color: #111; margin-top: 8px;">
                  ${winRate}%
                </div>
              </div>
              <div style="flex: 1; min-width: 120px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center; margin: 5px;">
                <div style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold;">Total Trades</div>
                <div style="font-size: 24px; font-weight: bold; color: #111; margin-top: 8px;">
                  ${trades.length}
                </div>
              </div>
            </div>

            <h4 style="border-bottom: 1px solid #eaeaea; padding-bottom: 10px; color: #333;">Notable Trades</h4>
            
            ${bestTrade.pnl! > 0 ? `
            <div style="margin-bottom: 15px;">
              <div style="font-size: 13px; color: #666; margin-bottom: 4px;">🏆 Best Trade</div>
              <div style="background-color: rgba(82, 164, 154, 0.1); padding: 12px; border-radius: 6px; border-left: 4px solid #52A49A;">
                <strong>${bestTrade.ticker}</strong> (${bestTrade.direction}) &rarr; <span style="color: #52A49A; font-weight: bold;">+$${bestTrade.pnl?.toFixed(2)}</span>
                <div style="font-size: 12px; color: #555; margin-top: 4px;">Closed on ${bestTrade.exitDate?.toLocaleDateString()}</div>
              </div>
            </div>
            ` : ''}
            
            ${worstTrade.pnl! < 0 ? `
            <div style="margin-bottom: 15px;">
              <div style="font-size: 13px; color: #666; margin-bottom: 4px;">📉 Worst Trade</div>
              <div style="background-color: rgba(221, 94, 86, 0.1); padding: 12px; border-radius: 6px; border-left: 4px solid #DD5E56;">
                <strong>${worstTrade.ticker}</strong> (${worstTrade.direction}) &rarr; <span style="color: #DD5E56; font-weight: bold;">-$${Math.abs(worstTrade.pnl!).toFixed(2)}</span>
                <div style="font-size: 12px; color: #555; margin-top: 4px;">Closed on ${worstTrade.exitDate?.toLocaleDateString()}</div>
              </div>
            </div>
            ` : ''}

            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #e5ff00; color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Go to Dashboard</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>You received this email because you opted into weekly digests.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #666; text-decoration: underline;">Manage your email preferences</a></p>
          </div>
        </div>
      `;

      try {
        const emailRes = await resend.emails.send({
          from: `OneCandle <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
          to: user.email,
          subject: `Your Weekly Trading Digest: ${isProfitable ? '+' : ''}$${Math.abs(totalPnl).toFixed(2)}`,
          html: htmlContent
        });
        results.push({ email: user.email, status: 'sent', id: emailRes.data?.id });
      } catch (err: any) {
        console.error(`Failed to send digest to ${user.email}`, err);
        results.push({ email: user.email, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('Failed to run weekly digest', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
