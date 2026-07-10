import { Metadata } from 'next';
import ToolsClient from './ToolsClient';

export const metadata: Metadata = {
  title: 'Trading Tools | OneCandle',
  description: 'Calculators and session clocks',
};

export default function ToolsPage() {
  return <ToolsClient />;
}
