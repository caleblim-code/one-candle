"use client";

import { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function ImageImport({ onParsed }: { onParsed: (data: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [rawText, setRawText] = useState('');

  const parseText = (text: string) => {
    setRawText(text); // Store raw text for debugging
    const data: any = { status: 'Closed' };
    
    // 1. Ticker, Direction, Size, Broker ID
    // Example: "BTCUSD buy 0.1 #352254083"
    const headMatch = text.match(/([A-Z0-9]+)\s+(buy|sell)\s+([0-9.]+)(?:\s+#?(\d+))?/i);
    if (headMatch) {
      data.ticker = headMatch[1];
      data.direction = headMatch[2].toLowerCase() === 'sell' ? 'Short' : 'Long';
      data.positionSize = headMatch[3];
      if (headMatch[4]) data.brokerTradeId = `#${headMatch[4]}`;
      
      if (['BTC', 'ETH', 'SOL', 'USDT'].some(c => data.ticker.includes(c))) data.assetClass = 'Crypto';
      else if (data.ticker.length >= 6 && !data.ticker.includes('US30') && !data.ticker.includes('NAS')) data.assetClass = 'Forex';
      else data.assetClass = 'Stocks';
    }

    // 2. Prices
    // Extremely forgiving: looking for two decimals separated by any combination of spaces/dashes/arrows
    const priceMatch = text.match(/([0-9]{2,}[.,][0-9]+)[\s\-=>~_—]+([0-9]{2,}[.,][0-9]+)/);
    if (priceMatch) {
      data.entryPrice = priceMatch[1].replace(',', '.');
      data.exitPrice = priceMatch[2].replace(',', '.');
    }

    // 3. Dates
    // We just find ALL dates in the format YYYY.MM.DD HH:mm:ss anywhere in the text
    const dateRegex = /\b(\d{4}[.,\/-]\d{2}[.,\/-]\d{2}\s+\d{2}:\d{2}:\d{2})\b/g;
    const dates = [...text.matchAll(dateRegex)];
    if (dates.length >= 2) {
      const formatToLocal = (mt5date: string) => {
        const [date, time] = mt5date.split(' ');
        return `${date.replace(/[.,\/]/g, '-')}T${time.slice(0,5)}`;
      };
      data.entryDate = formatToLocal(dates[0][1]);
      data.exitDate = formatToLocal(dates[1][1]);
    }

    // 4. S/L and T/P (handling OCR mistaking S/L for S|L, SIL, S1L, TIP, T|P, T1P, i/R, ARE)
    const slMatch = text.match(/S[/\|I1\\]?L[:;.]?\s*([0-9]+[.,]?[0-9]{0,5})/i);
    if (slMatch && slMatch[1] !== '0.00' && slMatch[1] !== '0') data.stopLoss = slMatch[1].replace(',', '.');

    const tpMatch = text.match(/(?:[Ti]\s*[/\|I1\\]?\s*[PR][:;.]?|ARE)\s*([0-9]+[.,]?[0-9]{0,5})/i);
    if (tpMatch && tpMatch[1] !== '0.00' && tpMatch[1] !== '0') data.takeProfit = tpMatch[1].replace(',', '.');

    // 5. Swap & Charges -> Fees
    let totalFees = 0;
    const swapMatch = text.match(/Swap[:;]?\s*(-?[0-9.]+)/i);
    if (swapMatch && !isNaN(parseFloat(swapMatch[1]))) totalFees += Math.abs(parseFloat(swapMatch[1]));
    
    const chargeMatch = text.match(/Charges[:;]?\s*(-?[0-9.]+)/i);
    if (chargeMatch && !isNaN(parseFloat(chargeMatch[1]))) totalFees += Math.abs(parseFloat(chargeMatch[1]));
    
    if (totalFees > 0) {
      data.fees = totalFees.toFixed(2);
    }

    // 6. PNL - appears on the price line as the last number (e.g. "64308.08 — 64185.00 -12.31")
    // OCR often misreads the minus sign as a digit (e.g. "-12.31" becomes "212.31")
    if (data.entryPrice && data.exitPrice) {
      // Find the line that contains both prices and grab the trailing number
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.includes(data.entryPrice.replace('.', ',')) || line.includes(data.entryPrice)) {
          // Look for a number at the end of this line (possibly negative, or with misread minus)
          const pnlMatch = line.match(/(-?[0-9]+[.,][0-9]{1,2})\s*$/);
          if (pnlMatch) {
            let pnlVal = parseFloat(pnlMatch[1].replace(',', '.'));
            // Make sure it's not the entry or exit price itself
            if (pnlVal.toString() !== data.entryPrice && pnlVal.toString() !== data.exitPrice) {
              // Smart sign correction: determine if the trade was a winner or loser
              // based on direction + price movement
              const entry = parseFloat(data.entryPrice);
              const exit = parseFloat(data.exitPrice);
              const isLong = data.direction === 'Long';
              const priceWentUp = exit > entry;
              const shouldBeProfit = isLong ? priceWentUp : !priceWentUp;

              // If the trade should be a loss but PNL is positive, flip the sign
              // (OCR likely misread the minus sign as a digit like "2")
              if (!shouldBeProfit && pnlVal > 0) {
                const pnlStr = pnlMatch[1];
                if (pnlStr.startsWith('2') || pnlStr.startsWith('7')) {
                  const withoutFirstDigit = parseFloat(pnlStr.substring(1).replace(',', '.'));
                  const rawDiff = Math.abs(entry - exit) * parseFloat(data.positionSize || '1');
                  
                  if (rawDiff > 0 && withoutFirstDigit > 0) {
                    const multOriginal = pnlVal / rawDiff;
                    const multStripped = withoutFirstDigit / rawDiff;
                    
                    const isPowerOf10 = (n: number) => {
                      if (n <= 0) return false;
                      const log = Math.log10(n);
                      return Math.abs(log - Math.round(log)) < 0.2;
                    };
                    
                    if (isPowerOf10(multStripped) && !isPowerOf10(multOriginal)) {
                      pnlVal = withoutFirstDigit;
                    }
                  } else if (withoutFirstDigit > 0) {
                     // Fallback if rawDiff is 0
                     pnlVal = withoutFirstDigit;
                  }
                }
                pnlVal = -Math.abs(pnlVal);
              }
              // If the trade should be a profit but PNL is negative, make it positive
              if (shouldBeProfit && pnlVal < 0) {
                pnlVal = Math.abs(pnlVal);
              }

              data.pnl = pnlVal.toFixed(2);
            }
          }
          break;
        }
      }
    }

    // If we didn't find the bare minimum, throw an error
    if (!data.ticker && !data.entryPrice) {
      throw new Error("Could not detect any trade data from this image. Ensure it's a clear MT5 result screenshot.");
    }

    return data;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setProgress('Initializing OCR engine...');

    try {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgress(`Scanning image... ${Math.round(m.progress * 100)}%`);
          }
        }
      } as any);
      
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      console.log('Raw OCR Text:', text); // useful for debugging if format changes
      
      const parsedData = parseText(text);
      onParsed(parsedData);

    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        OCR Image Import
      </h3>

      {error && <div style={{ backgroundColor: 'rgba(221, 94, 86, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--surface-light)', position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="spinner" style={{ width: '40px', height: '40px', marginBottom: '1rem' }}></span>
            <p className="mono fw-bold">{progress}</p>
          </div>
        ) : (
          <>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="10" cy="13" r="2"></circle><path d="M16 17l-3-3-3 3"></path></svg>
            <h4 style={{ marginBottom: '0.5rem' }}>Upload MT5 Screenshot</h4>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Upload a clear screenshot of your MT5 trade result. We will scan the text and automatically fill out the manual form for you.</p>
            
            <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
              Select Screenshot
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </>
        )}
      </div>

      {rawText && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Raw OCR Output (Debug)</h4>
          <pre style={{ backgroundColor: '#000', padding: '1rem', borderRadius: '8px', fontSize: '12px', color: '#0f0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {rawText}
          </pre>
        </div>
      )}
    </div>
  );
}
