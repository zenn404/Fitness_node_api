import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import EditScreenInfo from '@/components/EditScreenInfo';
import { AppScreen, PageHeader, SectionCard } from '@/components/app/design';

export default function ModalScreen() {
  const { t } = useTranslation();

  return (
    <AppScreen scroll={false}>
      <SectionCard className="my-auto">
        <PageHeader title={t('modal.title')} icon="info-outline" />
        <EditScreenInfo path="app/modal.tsx" />
      </SectionCard>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </AppScreen>
  );
}
