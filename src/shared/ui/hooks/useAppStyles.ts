import {useTheme} from '../theme';
import {screenStyles} from '../styles/screenStyles';
import {formStyles} from '../styles/formStyles';
import {modalStyles} from '../styles/modalStyles';
import {cardStyles} from '../styles/cardStyles';
import {listStyles} from '../styles/listStyles';
import {textStyles} from '../styles/textStyles';

export const useAppStyles = () => {
    const theme = useTheme();
    return {
        screen: screenStyles(theme),
        form: formStyles(theme),
        modal: modalStyles(theme),
        card: cardStyles(theme),
        list: listStyles(theme),
        text: textStyles(theme),
        theme,
    };
};
