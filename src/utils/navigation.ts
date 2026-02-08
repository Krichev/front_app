// src/utils/navigation.ts
import {CommonActions} from '@react-navigation/native';
import { navigationRef } from '../navigation';
import { MainTabParamList } from '../navigation/AppNavigator';

/**
 * Navigate to a tab screen from anywhere in the app
 * @param navigation The navigation object
 * @param tabName The name of the tab to navigate to
 * @param params Optional parameters to pass to the tab
 */
export const navigateToTab = (navigation: any, tabName: string, params?: any) => {
    navigation.dispatch(
        CommonActions.navigate({
            name: 'Main',
            params: {
                screen: tabName,
                params
            },
        })
    );
};

/**
 * Navigate to a tab screen using navigationRef (works from anywhere, including outside NavigationContainer)
 */
export const navigateToTabWithRef = <T extends keyof MainTabParamList>(
    tabName: T,
    params?: MainTabParamList[T]
) => {
    if (navigationRef.current?.isReady()) {
        navigationRef.current.dispatch(
            CommonActions.navigate({
                name: 'Main',
                params: {
                    screen: tabName,
                    params,
                },
            })
        );
    } else {
        console.warn('Navigation ref is not ready');
    }
};