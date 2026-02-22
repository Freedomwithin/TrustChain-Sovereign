import type { NextApiRequest, NextApiResponse } from 'next';
import { notarizeWallet } from '../../services/notaryService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!process.env.NOTARY_SECRET) {
    console.error('NOTARY_SECRET is not set');
    return res.status(500).json({ error: 'Notarization Failed' });
  }

  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Missing walletAddress' });
  }

  try {
    const result = await notarizeWallet(walletAddress);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Notarization error:', error);
    return res.status(500).json({ error: 'Notarization Failed' });
  }
}
