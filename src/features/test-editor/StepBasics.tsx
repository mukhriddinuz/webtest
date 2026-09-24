import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Test } from '@/services/types';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { ImageUploader } from '@/components/ImageUploader';
import { Field } from '@/components/Input';
import { validateBasics } from './validation';

export function StepBasics({
  test,
  onPatch,
}: {
  test: Test;
  onPatch: (patch: Partial<Test>) => void;
}) {
  const { t } = useTranslation();
  // The error only appears once the author has left the field, so an empty
  // form does not greet them in red.
  const [touched, setTouched] = useState(false);
  const errors = validateBasics(test);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-section-title text-text">{t('wizard.basics')}</h2>

      <Input
        label={t('wizard.name')}
        required
        value={test.title}
        placeholder={t('wizard.namePlaceholder')}
        error={touched && errors.title ? t(errors.title) : undefined}
        onBlur={() => setTouched(true)}
        onChange={(event) => onPatch({ title: event.target.value })}
      />

      <Textarea
        label={t('wizard.description')}
        value={test.description}
        rows={3}
        placeholder={t('wizard.descriptionPlaceholder')}
        onChange={(event) => onPatch({ description: event.target.value })}
      />

      <Input
        label={t('wizard.subject')}
        value={test.subject}
        placeholder={t('wizard.subjectPlaceholder')}
        onChange={(event) => onPatch({ subject: event.target.value })}
      />

      <Field label={t('wizard.cover')} hint={t('common.optional')}>
        <ImageUploader
          aspect="square"
          imageId={test.coverImageId}
          onChange={(coverImageId) => onPatch({ coverImageId })}
        />
      </Field>
    </div>
  );
}
