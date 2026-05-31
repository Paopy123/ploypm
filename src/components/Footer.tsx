import { FOOTER_TEXT } from '../content';

export function Footer() {
  return (
    <footer className="footer">
      <p>
        {FOOTER_TEXT}{' '}
        <a href="/admin" className="footer__admin">
          Update
        </a>
      </p>
    </footer>
  );
}
