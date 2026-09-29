import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services';
import { getTelegram } from '@/lib/telegram';
import { parseScan } from '@/lib/scan';
import { toast } from '@/store/toast';
import { useHaptics } from '@/hooks/usePrimaryAction';
import { resolveScan } from './resolveScan';

/**
 * Opens the camera, reads one code and takes the user where it points.
 *
 * `supported` is false wherever there is no Telegram scanner — a plain browser,
 * an old client — and the button that would use it should not be drawn: a
 * control that does nothing is worse than none.
 */
export function useQrScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const telegram = getTelegram();

  const supported = telegram.canScanQr();
  const [scanning, setScanning] = useState(false);
  // A second tap while the scanner is opening must not open a second one.
  const busy = useRef(false);

  const scan = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setScanning(true);
    try {
      const text = await telegram.scanQr(t('scan.prompt'));
      // Closed without reading anything: nothing to report.
      if (text === null) return;

      const outcome = await resolveScan(parseScan(text, window.location.origin), api);
      if (outcome.ok) {
        haptics.notification('success');
        navigate(outcome.route);
        return;
      }

      haptics.notification('error');
      if (outcome.reason === 'unknown') toast.error(t('scan.unknown'));
      else if (outcome.reason === 'notFound')
        toast.error(outcome.from === 'code' ? t('home.joinInvalid') : t('scan.notFound'));
      else toast.error(t('errors.unknown'));
    } finally {
      busy.current = false;
      setScanning(false);
    }
  }, [telegram, t, haptics, navigate]);

  return { supported, scanning, scan };
}
