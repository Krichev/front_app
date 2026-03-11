import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../app/providers/StoreProvider/store';
import { useGetScreenTimeBudgetQuery, useGetMyPenaltiesQuery } from '../../../entities/WagerState/model/slice/wagerApi';
import ScreenLockModule from '../../../shared/native/ScreenLockModule';

export const useDeviceScreenLock = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { i18n, t } = useTranslation();
  const [needsPermission, setNeedsPermission] = useState(false);

  const {
    data: budget,
    isLoading: isBudgetLoading,
    isError: isBudgetError,
  } = useGetScreenTimeBudgetQuery(undefined, { skip: !isAuthenticated });

  const {
    data: penaltiesData,
    isLoading: isPenaltiesLoading,
    isError: isPenaltiesError,
  } = useGetMyPenaltiesQuery({ status: 'IN_PROGRESS' }, { skip: !isAuthenticated });

  useEffect(() => {
    const checkPermission = async () => {
      if (ScreenLockModule) {
        const hasPermission = await ScreenLockModule.checkOverlayPermission();
        setNeedsPermission(!hasPermission);
      }
    };
    if (isAuthenticated) {
      checkPermission();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !ScreenLockModule) return;
    if (isBudgetLoading || isPenaltiesLoading || isBudgetError || isPenaltiesError) return;

    const penalties = penaltiesData?.content || [];
    const hasActivePenalty = penalties.length > 0;
    const isBudgetExhausted = budget && budget.availableMinutes <= 0;
    const shouldLock = isBudgetExhausted || hasActivePenalty;

    if (shouldLock) {
      let durationSeconds = 0;
      let reasonMessage = '';

      if (hasActivePenalty) {
        const penalty = penalties[0];
        const dueDate = new Date(penalty.dueDate).getTime();
        const now = Date.now();
        durationSeconds = Math.max(0, Math.floor((dueDate - now) / 1000));
        reasonMessage = t('screenLock.penaltyReason', { reason: penalty.description });
      } else {
        durationSeconds = (budget?.availableMinutes || 0) * 60;
        reasonMessage = t('screenLock.budgetExhaustedReason');
      }

      ScreenLockModule.activateLock({
        durationSeconds,
        reasonMessage,
        locale: i18n.language,
        title: t('screenLock.title'),
        settingsLabel: t('screenLock.settingsButton'),
      });
    } else {
      ScreenLockModule.deactivateLock();
    }
  }, [budget, penaltiesData, isAuthenticated, isBudgetLoading, isPenaltiesLoading, isBudgetError, isPenaltiesError, i18n.language, t]);

  const requestPermission = async () => {
    if (ScreenLockModule) {
      await ScreenLockModule.requestOverlayPermission();
    }
  };

  return {
    needsPermission,
    requestPermission,
  };
};
