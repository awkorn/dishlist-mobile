import { useFonts } from "expo-font";
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
} from "@expo-google-fonts/inter";

export const useCustomFonts = () => {
    const [fontsLoaded] = useFonts({
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,

        'Bricolage-Regular': require('../../assets/fonts/BricolageGrotesque-Regular.ttf'),
        'Bricolage-SemiBold': require('../../assets/fonts/BricolageGrotesque-SemiBold.ttf'),
        'Bricolage-Bold': require('../../assets/fonts/BricolageGrotesque-Bold.ttf'),

        'PlayfairDisplay-Regular': require('../../assets/fonts/PlayfairDisplay-Regular.ttf'),
        'PlayfairDisplay-SemiBold': require('../../assets/fonts/PlayfairDisplay-SemiBold.ttf'),
        'PlayfairDisplay-Medium': require('../../assets/fonts/PlayfairDisplay-Medium.ttf'),
    });
    return fontsLoaded;
};
