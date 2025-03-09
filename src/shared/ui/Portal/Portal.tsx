import React, {ReactNode} from 'react';
import {Portal as PaperPortal} from 'react-native-paper';

interface CustomPortalProps {
    children: ReactNode;
}

export const Portal = (props: CustomPortalProps) => {
    const { children } = props;

    return (
        <PaperPortal>
            {children}
        </PaperPortal>
    );
};