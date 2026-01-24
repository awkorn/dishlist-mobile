import { useFonts } from "expo-font";

export const useCustomFonts = () => {
    const [fontsLoaded] = useFonts({
        'Bricolage-Regular': require('../../assets/fonts/BricolageGrotesque-Regular.ttf'),
        'Bricolage-Bold': require('../../assets/fonts/BricolageGrotesque-Bold.ttf'),
        'Bricolage-Light': require('../../assets/fonts/BricolageGrotesque-Light.ttf'),
        'Bricolage-SemiBold': require('../../assets/fonts/BricolageGrotesque-SemiBold.ttf'),
        
        'GeneralSans-SemiBold': require('../../assets/fonts/GeneralSans-Semibold.ttf'),

        'SourceSerif4-Regular': require('../../assets/fonts/SourceSerif4-Regular.ttf'),
        'SourceSerif4-Medium': require('../../assets/fonts/SourceSerif4-Medium.ttf'),
        'SourceSerif4-SemiBold': require('../../assets/fonts/SourceSerif4-SemiBold.ttf'),

        'PlayfairDisplay-Regular': require('../../assets/fonts/PlayfairDisplay-Regular.ttf'),
        'PlayfairDisplay-SemiBold': require('../../assets/fonts/PlayfairDisplay-SemiBold.ttf'),
        'PlayfairDisplay-Medium': require('../../assets/fonts/PlayfairDisplay-Medium.ttf'),

    });
    return fontsLoaded;
};