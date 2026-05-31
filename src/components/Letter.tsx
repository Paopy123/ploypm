import { useState } from 'react';
import { LETTER_BUTTON_LABEL, LETTER_MESSAGE } from '../content';
import { HeartIcon } from './HeartIcon';

export function Letter() {
  const [open, setOpen] = useState(false);

  return (
    <section className="section letter-section" aria-labelledby="letter-heading">
      <h2 id="letter-heading" className="sr-only">
        Love letter
      </h2>
      {!open ? (
        <button type="button" className="letter-btn" onClick={() => setOpen(true)}>
          <span className="letter-btn__inner">
            <HeartIcon pulse size={18} />
            {LETTER_BUTTON_LABEL}
          </span>
        </button>
      ) : (
        <article className="letter-content" aria-label="Love letter">
          {LETTER_MESSAGE}
        </article>
      )}
    </section>
  );
}
