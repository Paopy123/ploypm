/** Fire-and-forget email when a visitor opens a letter (Netlify function). */
export async function notifyLetterOpened(params: {
  letterId: string;
  letterTitle: string;
}): Promise<void> {
  try {
    await fetch('/.netlify/functions/letter-opened', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        letterId: params.letterId,
        letterTitle: params.letterTitle,
      }),
    });
  } catch {
    /* Don't block opening the letter if email fails */
  }
}
