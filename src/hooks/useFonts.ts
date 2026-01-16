import { useFonts } from "expo-font";

export const useCustomFonts = () => {
    const [fontsLoaded] = useFonts({
        'Bricolage-Regular': require('../../assets/fonts/BricolageGrotesque-Regular.ttf'),
        'Bricolage-Bold': require('../../assets/fonts/BricolageGrotesque-Bold.ttf'),
        'Bricolage-Light': require('../../assets/fonts/BricolageGrotesque-Light.ttf'),
        'Bricolage-SemiBold': require('../../assets/fonts/BricolageGrotesque-SemiBold.ttf'),
        'GeneralSans-SemiBold': require('../../assets/fonts/GeneralSans-Semibold.ttf'),
    });
    return fontsLoaded;
};