import { useState } from 'react';
import { PinGate, isPinUnlocked } from '../components/PinGate';
import { SiteContent } from '../SiteContent';

export function PublicPage() {
  const [unlocked, setUnlocked] = useState(isPinUnlocked);

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  return <SiteContent />;
}
