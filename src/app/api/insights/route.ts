import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  stat: string;
  severity: 'positive' | 'negative' | 'neutral';
  filterParams?: Record<string, string>;
}

const MIN_TRADES_FOR_INSIGHT = 10;
const MIN_TRADES_PER_BUCKET = 5;

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account');

    const where: any = { userId: session.id, status: 'Closed', pnl: { not: null } };
    if (accountId && accountId !== 'all') {
      where.accountId = accountId;
    }

    const trades = await prisma.trade.findMany({
      where,
      include: { playbook: true },
      orderBy: { entryDate: 'asc' }
    });

    // Not enough data check
    if (trades.length < MIN_TRADES_FOR_INSIGHT) {
      return NextResponse.json({
        success: true,
        insights: [],
        totalTrades: trades.length,
        tradesNeeded: MIN_TRADES_FOR_INSIGHT - trades.length,
        insufficient: true
      });
    }

    const insights: Insight[] = [];

    // ===== 1. TIME-OF-DAY PATTERN =====
    const hourBuckets: Record<string, { wins: number; losses: number; totalPnl: number; count: number }> = {};
    for (const t of trades) {
      const hour = new Date(t.entryDate).getHours();
      const bucket = hour < 6 ? 'Pre-Market (0-6)' :
                     hour < 10 ? 'Morning (6-10)' :
                     hour < 12 ? 'Late Morning (10-12)' :
                     hour < 14 ? 'Early Afternoon (12-14)' :
                     hour < 16 ? 'Afternoon (14-16)' :
                     'After Hours (16+)';
      if (!hourBuckets[bucket]) hourBuckets[bucket] = { wins: 0, losses: 0, totalPnl: 0, count: 0 };
      hourBuckets[bucket].count++;
      hourBuckets[bucket].totalPnl += t.pnl!;
      if (t.pnl! > 0) hourBuckets[bucket].wins++;
      else hourBuckets[bucket].losses++;
    }

    const validHourBuckets = Object.entries(hourBuckets).filter(([, v]) => v.count >= MIN_TRADES_PER_BUCKET);
    if (validHourBuckets.length >= 2) {
      const sorted = validHourBuckets.sort((a, b) => {
        const wrA = a[1].count > 0 ? (a[1].wins / a[1].count) * 100 : 0;
        const wrB = b[1].count > 0 ? (b[1].wins / b[1].count) * 100 : 0;
        return wrB - wrA;
      });
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      const bestWR = ((best[1].wins / best[1].count) * 100).toFixed(0);
      const worstWR = ((worst[1].wins / worst[1].count) * 100).toFixed(0);
      const bestAvgPnl = (best[1].totalPnl / best[1].count).toFixed(2);

      if (parseFloat(bestWR) - parseFloat(worstWR) > 10) {
        insights.push({
          id: 'time-of-day',
          type: 'Time of Day',
          title: `Your best window is ${best[0]}`,
          description: `Your win rate during ${best[0]} is ${bestWR}% (avg $${bestAvgPnl}/trade) vs ${worstWR}% during ${worst[0]}. Consider focusing your trading during your strongest hours.`,
          stat: `${bestWR}% vs ${worstWR}%`,
          severity: 'neutral',
        });
      }
    }

    // ===== 2. DAY-OF-WEEK PATTERN =====
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayBuckets: Record<string, { wins: number; losses: number; totalPnl: number; count: number }> = {};
    for (const t of trades) {
      const day = dayNames[new Date(t.entryDate).getDay()];
      if (!dayBuckets[day]) dayBuckets[day] = { wins: 0, losses: 0, totalPnl: 0, count: 0 };
      dayBuckets[day].count++;
      dayBuckets[day].totalPnl += t.pnl!;
      if (t.pnl! > 0) dayBuckets[day].wins++;
      else dayBuckets[day].losses++;
    }

    const validDayBuckets = Object.entries(dayBuckets).filter(([, v]) => v.count >= MIN_TRADES_PER_BUCKET);
    if (validDayBuckets.length >= 2) {
      const sorted = validDayBuckets.sort((a, b) => {
        const wrA = a[1].count > 0 ? (a[1].wins / a[1].count) * 100 : 0;
        const wrB = b[1].count > 0 ? (b[1].wins / b[1].count) * 100 : 0;
        return wrB - wrA;
      });
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      const bestWR = ((best[1].wins / best[1].count) * 100).toFixed(0);
      const worstWR = ((worst[1].wins / worst[1].count) * 100).toFixed(0);

      if (parseFloat(bestWR) - parseFloat(worstWR) > 10) {
        insights.push({
          id: 'day-of-week',
          type: 'Day of Week',
          title: `${best[0]}s are your strongest day`,
          description: `You have a ${bestWR}% win rate on ${best[0]}s ($${(best[1].totalPnl / best[1].count).toFixed(2)} avg P&L) vs ${worstWR}% on ${worst[0]}s ($${(worst[1].totalPnl / worst[1].count).toFixed(2)} avg P&L).`,
          stat: `${best[0]} ${bestWR}% WR`,
          severity: 'neutral',
        });
      }
    }

    // ===== 3. MISTAKE TAG IMPACT =====
    const mistakeMap: Record<string, { totalPnl: number; count: number; avgPnl: number }> = {};
    const tradesWithoutMistakes = trades.filter(t => !t.mistakeTags || t.mistakeTags.trim() === '');
    const avgPnlWithout = tradesWithoutMistakes.length > 0
      ? tradesWithoutMistakes.reduce((s, t) => s + t.pnl!, 0) / tradesWithoutMistakes.length
      : 0;

    for (const t of trades) {
      if (t.mistakeTags) {
        const tags = t.mistakeTags.split(',').map(s => s.trim()).filter(Boolean);
        for (const tag of tags) {
          if (!mistakeMap[tag]) mistakeMap[tag] = { totalPnl: 0, count: 0, avgPnl: 0 };
          mistakeMap[tag].totalPnl += t.pnl!;
          mistakeMap[tag].count++;
        }
      }
    }

    for (const [tag, data] of Object.entries(mistakeMap)) {
      data.avgPnl = data.totalPnl / data.count;
    }

    const sortedMistakes = Object.entries(mistakeMap)
      .filter(([, v]) => v.count >= 3)
      .sort((a, b) => a[1].totalPnl - b[1].totalPnl);

    if (sortedMistakes.length > 0 && sortedMistakes[0][1].totalPnl < 0) {
      const [tag, data] = sortedMistakes[0];
      insights.push({
        id: `mistake-${tag}`,
        type: 'Mistake Impact',
        title: `"${tag}" is your costliest mistake`,
        description: `Trades tagged "${tag}" have lost you $${Math.abs(data.totalPnl).toFixed(2)} total across ${data.count} trades (avg $${data.avgPnl.toFixed(2)}/trade). Trades without mistakes average $${avgPnlWithout.toFixed(2)}/trade.`,
        stat: `-$${Math.abs(data.totalPnl).toFixed(2)} total`,
        severity: 'negative',
      });
    }

    // ===== 4. SETUP / PLAYBOOK PERFORMANCE =====
    const setupMap: Record<string, { wins: number; totalPnl: number; count: number }> = {};
    for (const t of trades) {
      const key = t.setupTag || 'No Setup';
      if (!setupMap[key]) setupMap[key] = { wins: 0, totalPnl: 0, count: 0 };
      setupMap[key].count++;
      setupMap[key].totalPnl += t.pnl!;
      if (t.pnl! > 0) setupMap[key].wins++;
    }

    const validSetups = Object.entries(setupMap).filter(([k, v]) => v.count >= MIN_TRADES_PER_BUCKET && k !== 'No Setup');
    if (validSetups.length >= 1) {
      const sorted = validSetups.sort((a, b) => {
        const expA = a[1].totalPnl / a[1].count;
        const expB = b[1].totalPnl / b[1].count;
        return expB - expA;
      });
      const best = sorted[0];
      const bestWR = ((best[1].wins / best[1].count) * 100).toFixed(0);
      const bestExp = (best[1].totalPnl / best[1].count).toFixed(2);

      insights.push({
        id: 'best-setup',
        type: 'Setup Performance',
        title: `"${best[0]}" is your best performing setup`,
        description: `${bestWR}% win rate with $${bestExp} average expectancy across ${best[1].count} trades.`,
        stat: `$${bestExp} avg`,
        severity: 'positive',
      });

      if (sorted.length >= 2) {
        const worst = sorted[sorted.length - 1];
        const worstWR = ((worst[1].wins / worst[1].count) * 100).toFixed(0);
        const worstExp = (worst[1].totalPnl / worst[1].count).toFixed(2);
        if (parseFloat(worstExp) < 0) {
          insights.push({
            id: 'worst-setup',
            type: 'Setup Performance',
            title: `Consider dropping "${worst[0]}"`,
            description: `This setup has a ${worstWR}% win rate with -$${Math.abs(parseFloat(worstExp)).toFixed(2)} avg expectancy across ${worst[1].count} trades.`,
            stat: `${worstWR}% WR`,
            severity: 'negative',
          });
        }
      }
    }

    // Playbook performance
    const playbookMap: Record<string, { name: string; wins: number; totalPnl: number; count: number }> = {};
    for (const t of trades) {
      if (t.playbook) {
        const key = t.playbookId!;
        if (!playbookMap[key]) playbookMap[key] = { name: t.playbook.name, wins: 0, totalPnl: 0, count: 0 };
        playbookMap[key].count++;
        playbookMap[key].totalPnl += t.pnl!;
        if (t.pnl! > 0) playbookMap[key].wins++;
      }
    }

    const validPlaybooks = Object.entries(playbookMap).filter(([, v]) => v.count >= MIN_TRADES_PER_BUCKET);
    if (validPlaybooks.length >= 1) {
      const sorted = validPlaybooks.sort((a, b) => (b[1].totalPnl / b[1].count) - (a[1].totalPnl / a[1].count));
      const best = sorted[0];
      const bestWR = ((best[1].wins / best[1].count) * 100).toFixed(0);
      const bestExp = (best[1].totalPnl / best[1].count).toFixed(2);
      insights.push({
        id: 'best-playbook',
        type: 'Playbook Performance',
        title: `Playbook "${best[1].name}" is delivering`,
        description: `${bestWR}% win rate with $${bestExp} expectancy across ${best[1].count} trades.`,
        stat: `$${bestExp} avg`,
        severity: 'positive',
      });
    }

    // ===== 5. OVERTRADING DETECTION =====
    const dailyTradeCounts: Record<string, { count: number; totalPnl: number }> = {};
    for (const t of trades) {
      const dateKey = new Date(t.entryDate).toISOString().split('T')[0];
      if (!dailyTradeCounts[dateKey]) dailyTradeCounts[dateKey] = { count: 0, totalPnl: 0 };
      dailyTradeCounts[dateKey].count++;
      dailyTradeCounts[dateKey].totalPnl += t.pnl!;
    }

    const tradingDays = Object.values(dailyTradeCounts);
    if (tradingDays.length >= 5) {
      const avgDaily = tradingDays.reduce((s, d) => s + d.count, 0) / tradingDays.length;
      const threshold = avgDaily * 1.5;
      const overtradeDays = tradingDays.filter(d => d.count > threshold);
      const normalDays = tradingDays.filter(d => d.count <= threshold);

      if (overtradeDays.length >= 3) {
        const avgPnlOvertrade = overtradeDays.reduce((s, d) => s + d.totalPnl, 0) / overtradeDays.length;
        const avgPnlNormal = normalDays.length > 0
          ? normalDays.reduce((s, d) => s + d.totalPnl, 0) / normalDays.length
          : 0;

        if (avgPnlOvertrade < avgPnlNormal) {
          insights.push({
            id: 'overtrading',
            type: 'Overtrading',
            title: 'More trades ≠ more profit',
            description: `On days you traded more than ${Math.ceil(threshold)} times (${overtradeDays.length} days), your avg daily P&L was $${avgPnlOvertrade.toFixed(2)} vs $${avgPnlNormal.toFixed(2)} on normal days. Overtrading is hurting your bottom line.`,
            stat: `$${avgPnlOvertrade.toFixed(2)} vs $${avgPnlNormal.toFixed(2)}`,
            severity: 'negative',
          });
        }
      }
    }

    // ===== 6. WIN/LOSS STREAK & REVENGE TRADING =====
    // Check if trade frequency/size increases after consecutive losses
    let revengeInstances = 0;
    let nonRevengeInstances = 0;
    let revengePnl = 0;
    let nonRevengePnl = 0;

    for (let i = 2; i < trades.length; i++) {
      const prev1 = trades[i - 1];
      const prev2 = trades[i - 2];
      const current = trades[i];

      // Two consecutive losses before this trade
      if (prev1.pnl! < 0 && prev2.pnl! < 0) {
        // Check if current trade has larger position size (possible revenge)
        if (current.positionSize > prev1.positionSize * 1.2) {
          revengeInstances++;
          revengePnl += current.pnl!;
        } else {
          nonRevengeInstances++;
          nonRevengePnl += current.pnl!;
        }
      }
    }

    if (revengeInstances >= 5) {
      const avgRevenge = revengePnl / revengeInstances;
      insights.push({
        id: 'revenge-trading',
        type: 'Revenge Trading',
        title: 'Sizing up after losses is costing you',
        description: `After 2+ consecutive losses, you increased position size ${revengeInstances} times. Those trades averaged $${avgRevenge.toFixed(2)} P&L. This pattern suggests emotional revenge trading.`,
        stat: `${revengeInstances} instances`,
        severity: avgRevenge < 0 ? 'negative' : 'neutral',
      });
    }

    // ===== 7. RISK/REWARD CONSISTENCY =====
    let earlyExitWins = 0;
    let lateExitLosses = 0;
    let rrTradesChecked = 0;

    for (const t of trades) {
      if (t.stopLoss && t.takeProfit && t.exitPrice && t.entryPrice) {
        rrTradesChecked++;
        const plannedRisk = Math.abs(t.entryPrice - t.stopLoss);
        const plannedReward = Math.abs(t.takeProfit - t.entryPrice);

        if (t.pnl! > 0) {
          // Winning trade: did they exit before take profit?
          const actualReward = Math.abs(t.exitPrice - t.entryPrice);
          if (actualReward < plannedReward * 0.7) {
            earlyExitWins++;
          }
        } else if (t.pnl! < 0) {
          // Losing trade: did they exit past their stop loss?
          const actualLoss = Math.abs(t.exitPrice - t.entryPrice);
          if (actualLoss > plannedRisk * 1.3) {
            lateExitLosses++;
          }
        }
      }
    }

    if (rrTradesChecked >= MIN_TRADES_FOR_INSIGHT) {
      if (earlyExitWins > rrTradesChecked * 0.3) {
        insights.push({
          id: 'early-exit-wins',
          type: 'Risk/Reward',
          title: "You're cutting winners short",
          description: `${earlyExitWins} of ${rrTradesChecked} trades with SL/TP data hit profit but exited well before the take-profit level. This reduces your reward-to-risk ratio.`,
          stat: `${((earlyExitWins / rrTradesChecked) * 100).toFixed(0)}% early exits`,
          severity: 'negative',
        });
      }

      if (lateExitLosses > rrTradesChecked * 0.3) {
        insights.push({
          id: 'late-exit-losses',
          type: 'Risk/Reward',
          title: "You're holding losers too long",
          description: `${lateExitLosses} of ${rrTradesChecked} trades exceeded the planned stop-loss level before exiting. This amplifies your losses beyond planned risk.`,
          stat: `${((lateExitLosses / rrTradesChecked) * 100).toFixed(0)}% past SL`,
          severity: 'negative',
        });
      }
    }

    return NextResponse.json({
      success: true,
      insights,
      totalTrades: trades.length,
      tradesNeeded: 0,
      insufficient: false
    });
  } catch (error) {
    console.error('Failed to compute insights', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
