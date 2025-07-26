// src/utils/navigation.ts
import {CommonActions} from '@react-navigation/native';

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