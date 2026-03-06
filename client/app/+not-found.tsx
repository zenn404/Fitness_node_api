import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppScreen, PageHeader, SectionCard } from '@/components/app/design';
import { Text } from '@/components/ui/text';
import { getThemePalette } from '@/lib/theme-palette';
import { useThemeStore } from '@/store/theme-store';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <AppScreen scroll={false}>
        <SectionCard className="my-auto items-center">
          <PageHeader title={t('notFound.title')} subtitle={t('notFound.message')} icon="error-outline" />
          <Link href="/" style={{ marginTop: 8 }}>
            <Text className="font-semibold" style={{ color: colors.accent }}>
              {t('notFound.goHome')}
            </Text>
          </Link>
        </SectionCard>
      </AppScreen>
    </>
  );
}
