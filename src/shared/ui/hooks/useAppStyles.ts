import {useTheme} from '../theme';
import {screenStyles} from '../styles/screenStyles';
import {formStyles} from '../styles/formStyles';
import {modalStyles} from '../styles/modalStyles';
import {cardStyles} from '../styles/cardStyles';
import {listStyles} from '../styles/listStyles';
import {textStyles} from '../styles/textStyles';
import {buttonStyles} from '../styles/buttonStyles';
import {statusStyles} from '../styles/statusStyles';
import {gameStyles} from '../styles/gameStyles';

export const useAppStyles = () => {
    const theme = useTheme();
    return {
        screen: screenStyles(theme),
        form: formStyles(theme),
        modal: modalStyles(theme),
        card: cardStyles(theme),
        list: listStyles(theme),
        text: textStyles(theme),
        button: buttonStyles(theme),
        status: statusStyles(theme),
        game: gameStyles(theme),
        theme,
    };
};
