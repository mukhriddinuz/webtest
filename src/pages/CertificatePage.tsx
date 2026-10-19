import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Maximize2, Share2 } from 'lucide-react';
import { appUrl } from '@/lib/appUrl';
import { formatDate, fullName } from '@/lib/format';
import { getTelegram } from '@/lib/telegram';
import { toast } from '@/store/toast';
import { useAttempt, useAttemptQuestions, useTest, useUser } from '@/hooks/queries';
import { useHaptics, usePrimaryAction } from '@/hooks/usePrimaryAction';
import { Page, PageHeader } from '@/app/AppLayout';
import { Button } from '@/components/Button';
import { ImageZoom } from '@/components/ImageZoom';
import { ListRow, ListSection } from '@/components/ListSection';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { buildCertificate } from '@/features/certificate/certificate';
import { certificateDataUrl, certificatePng, qrMatrix } from '@/features/certificate/render';
import type { QrMatrix } from '@/features/certificate/ornaments';
import { certificateResultFor } from '@/features/certificate/result';
import { certificateText } from '@/features/certificate/text';

interface DrawnCertificate {
  blob: Blob;
  url: string;
}

export default function CertificatePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();

  const attemptQuery = useAttempt(attemptId);
  const testQuery = useTest(testId);
  const questionsQuery = useAttemptQuestions(attemptId);
  const attempt = attemptQuery.data;
  const test = testQuery.data;
  const owner = useUser(attempt?.userId);
  const author = useUser(test?.authorId);

  // A paper still being written has nothing to certify yet.
  useEffect(() => {
    if (attempt?.status === 'in_progress' && testId && attemptId) {
      navigate(`/t/${testId}/attempt/${attemptId}`, { replace: true });
    }
  }, [attempt?.status, testId, attemptId, navigate]);

  // The code on the certificate opens the test. Drawing waits for it, so the
  // picture is not shown once without the code and then redrawn with it.
  const [qr, setQr] = useState<QrMatrix | null | undefined>(undefined);
  useEffect(() => {
    if (!testId) return;
    let active = true;
    void qrMatrix(appUrl(`/t/${testId}`)).then((matrix) => {
      if (active) setQr(matrix);
    });
    return () => {
      active = false;
    };
  }, [testId]);

  const certificate = useMemo(() => {
    if (!attempt || !test || !owner.data || !author.data || !questionsQuery.data) return null;
    if (attempt.status === 'in_progress' || qr === undefined) return null;
    const data = buildCertificate({
      attemptId: attempt.id,
      recipient: fullName(owner.data),
      testTitle: test.title,
      author: fullName(author.data),
      issuedAt: attempt.finishedAt ?? attempt.startedAt,
      durationSec: attempt.finishedAt
        ? Math.max(
            0,
            Math.round(
              (new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt).getTime()) /
                1000,
            ),
          )
        : undefined,
      result: certificateResultFor(test, attempt, questionsQuery.data),
    });
    return { data, text: certificateText(data, t, i18n.language, qr) };
  }, [attempt, test, owner.data, author.data, questionsQuery.data, qr, t, i18n.language]);

  // The picture is drawn once as a real image: that is what gets saved and
  // shared, and what a long press on the preview picks up.
  const [drawn, setDrawn] = useState<DrawnCertificate | null>(null);
  useEffect(() => {
    if (!certificate) return;
    let active = true;
    let objectUrl: string | undefined;
    certificatePng(certificate.text)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setDrawn({ blob, url: objectUrl });
      })
      .catch(() => undefined);
    return () => {
      active = false;
      setDrawn(null);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [certificate]);

  const [zoomed, setZoomed] = useState(false);
  const previewSrc = certificate ? (drawn?.url ?? certificateDataUrl(certificate.text)) : null;

  const fileName = certificate ? `TestHub-${certificate.data.number}.png` : 'certificate.png';

  const imageBlob = useCallback(async (): Promise<Blob> => {
    if (drawn) return drawn.blob;
    if (!certificate) throw new Error('Certificate is not ready');
    return certificatePng(certificate.text);
  }, [drawn, certificate]);

  const download = useCallback(async () => {
    try {
      const url = URL.createObjectURL(await imageBlob());
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      haptics.notification('success');
    } catch {
      toast.error(t('certificate.failed'));
    }
  }, [imageBlob, fileName, haptics, t]);

  const share = useCallback(async () => {
    const message = t('certificate.shareText', { title: test?.title ?? '' });
    try {
      const file = new File([await imageBlob()], fileName, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: message });
        return;
      }
    } catch (error) {
      // Closing the share sheet is a choice, not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
    // This client cannot hand a picture to another app: share the words instead.
    if (getTelegram().switchInlineQuery(message)) return;
    void navigator.clipboard?.writeText(`${message} ${appUrl(`/t/${testId}`)}`).then(
      () => toast.success(t('common.copied')),
      () => undefined,
    );
  }, [imageBlob, fileName, t, test?.title, testId]);

  const copyNumber = useCallback(() => {
    if (!certificate) return;
    void navigator.clipboard?.writeText(certificate.data.number).then(
      () => toast.success(t('common.copied')),
      () => undefined,
    );
  }, [certificate, t]);

  usePrimaryAction(certificate ? { label: t('certificate.download'), onClick: download } : null);

  if (attemptQuery.isPending || testQuery.isPending || questionsQuery.isPending) {
    return (
      <Page>
        <PageHeader title={t('certificate.title')} onBack="auto" />
        <LoadingState count={2} />
      </Page>
    );
  }

  if (attemptQuery.isError || testQuery.isError || !attempt || !test) {
    return (
      <Page>
        <PageHeader title={t('certificate.title')} onBack="auto" />
        <ErrorState onRetry={() => void attemptQuery.refetch()} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title={t('certificate.title')}
        subtitle={test.title}
        onBack={() => navigate(`/t/${test.id}/result/${attempt.id}`, { replace: true })}
      />

      {certificate ? (
        <>
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label={t('certificate.zoom')}
            className="relative mt-2 block w-full rounded-card active:opacity-90"
          >
            <img
              src={previewSrc ?? undefined}
              alt={`${t('certificate.title')}: ${certificate.data.recipient}, ${test.title}`}
              width={1414}
              height={1000}
              className="block w-full rounded-card bg-white shadow-md ring-1 ring-black/5"
            />
            <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white">
              <Maximize2 size={14} strokeWidth={1.75} />
            </span>
          </button>
          <ListSection className="mt-5">
            <ListRow
              title={t('certificate.number')}
              value={<span className="tnum text-text">{certificate.data.number}</span>}
              icon={<Copy size={16} strokeWidth={1.75} />}
              chevron={false}
              onClick={copyNumber}
            />
            <ListRow
              title={t('certificate.date')}
              value={formatDate(certificate.data.issuedAt, i18n.language)}
              chevron={false}
            />
          </ListSection>
          <Button
            className="mt-2"
            fullWidth
            variant="secondary"
            icon={<Share2 size={16} strokeWidth={1.75} />}
            onClick={() => void share()}
          >
            {t('certificate.share')}
          </Button>
          <p className="mt-3 text-center text-small text-text-muted">{t('certificate.hint')}</p>
        </>
      ) : (
        <LoadingState count={1} />
      )}

      {zoomed && previewSrc && (
        <ImageZoom
          src={previewSrc}
          alt={certificate?.data.recipient}
          panWidth={1100}
          onClose={() => setZoomed(false)}
        />
      )}
    </Page>
  );
}
