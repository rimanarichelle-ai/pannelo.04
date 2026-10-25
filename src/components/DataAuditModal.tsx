import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import type { Translations } from '@/lib/translations';

interface DataAuditModalProps {
  onClose: () => void;
  t: Translations;
}

export default function DataAuditModal({ onClose, t }: DataAuditModalProps) {
  useEffect(() => {
    const scrollY = window.scrollY;
    const origPos = document.body.style.position;
    const origTop = document.body.style.top;
    const origLeft = document.body.style.left;
    const origRight = document.body.style.right;
    const origWidth = document.body.style.width;
    const origOverflow = document.body.style.overflow;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.position = origPos;
      document.body.style.top = origTop;
      document.body.style.left = origLeft;
      document.body.style.right = origRight;
      document.body.style.width = origWidth;
      document.body.style.overflow = origOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs safe-top safe-bottom"
      role="dialog"
      aria-modal="true"
      aria-label={t.ui.auditModalTitle}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full max-h-[min(88vh,calc(100dvh-2rem))] flex flex-col shadow-2xl shadow-black/80 overflow-hidden animate-modal-in"
      >
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface-elevated)] shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#C8102E]" />
            <h3 className="font-heading font-black text-sm uppercase tracking-wider text-[var(--text-main)]">
              {t.ui.auditModalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.ui.closeModal}
            className="w-9 h-9 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] active:scale-95 flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="text-sm font-bold">✕</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto overscroll-contain text-xs sm:text-sm text-[var(--text-secondary)] space-y-4 no-scrollbar touch-pan-y flex-1">
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300">
            <span className="font-bold text-emerald-900 dark:text-emerald-200">{t.ui.auditIntegratedHeading}</span>
            <ul className="mt-1.5 text-xs space-y-1 list-disc list-inside">
              <li><strong>1. Smash Burger (6)</strong> : Classic (300 DA), Stacker (350 DA), Chicken Crispy (350 DA), Wham (400 DA), Big Classic (500 DA), Pannelo (600 DA)</li>
              <li><strong>2. Pocket (3)</strong> : Chicken (500 DA), Beef (500 DA), Pannelo (600 DA)</li>
              <li><strong>3. Fries (2)</strong> : Classic (150 DA), Cheesy (250 DA)</li>
              <li><strong>4. Drinks / Boissons (12)</strong> : Standard drinks (4), Jus naturels pressés (5), Mojitos (3)</li>
              <li><strong>5. Sweets (18)</strong> : Crêpes sucrées (15), Pancakes (3) + Option Supplément Nutella (+100 DA)</li>
              <li><strong>6. Pizza Sauce Rouge (9)</strong> : Margherita, 3 Cheese, Chicken, Beef, Pepperoni, Smoky Chicken, Tuna Pop, Mexicana, Végétarien (Mini / Normal / Mega)</li>
              <li><strong>7. Pizza Sauce Blanche (6)</strong> : Cheese Lover, Smoky Saumon, Shrimp, Mushroom, Pannelo Royal, Pannelo Signature (Mini / Normal / Mega)</li>
              <li><strong>8. Tacos (5)</strong> : Chicken, Beef, Crispy, Mix, Gratiné (M / L / XL) + 3 Suppléments</li>
              <li><strong>9. Sandwiches (3)</strong> : Panny (350 DA), Chicky (350 DA), Mixto (450 DA) + 4 Suppléments + Pain Brioche / Matlou3</li>
              <li><strong>10. Tombik (3)</strong> : Chicken (550 DA), Beef (550 DA), Crispy (550 DA)</li>
              <li><strong>11. Calzon (1)</strong> : Base sauce tomate & cheddar avec 6 garnitures au choix</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200">
            <span className="font-bold text-amber-900 dark:text-amber-100">{t.ui.auditFlaggedHeading}</span>
            <ul className="mt-1 text-xs space-y-1 list-disc list-inside">
              <li><strong>Calzon</strong> : Le prix exact n&apos;est pas distinctement visible sur l&apos;image source du menu papier. Il est représenté comme null et affiché sous la mention « {t.ui.priceToConfirmBadge} » (jamais 0 DA ni gratuit). Les 6 garnitures sont confirmées.</li>
              <li><strong>Tacos Gratiné</strong> : Ingrédients non détaillés sur la maquette d&apos;origine. Prix M (650), L (850) et XL (1050) confirmés.</li>
              <li><strong>Pizza Pannelo Signature</strong> : Recette autorisant le choix de sauce blanche ou sauce tomate.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[var(--text-main)] mb-1">{t.ui.auditPhotosHeading}</h4>
            <p className="text-xs">
              {t.ui.auditPhotosDesc}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
