import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Page, PageHeader } from '@/app/AppLayout';
import { EmptyState } from '@/components/EmptyState';
import { usePrimaryAction } from '@/hooks/usePrimaryAction';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  usePrimaryAction({
    label: t('common.goHome'),
    onClick: () => navigate('/', { replace: true }),
  });

  return (
    <Page>
      <PageHeader title={t('common.notFound')} />
      <EmptyState
        title={t('common.notFound')}
        description={t('common.notFoundText')}
        actionLabel={t('common.goHome')}
        onAction={() => navigate('/', { replace: true })}
      />
    </Page>
  );
}
