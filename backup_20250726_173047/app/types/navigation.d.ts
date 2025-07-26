// import {NativeStackScreenProps} from '@react-navigation/native-stack';
//
// declare global {
//     namespace ReactNavigation {
//         interface RootParamList extends RootStackParamList {}
//     }
// }
//
// // export type RootStackParamList = {
// //     Home: undefined;
// //     Profile: undefined;
// //     // Add all your screens here
// // };
//
// export type RootStackParamList = {
//     MainMenu: undefined;
//     Difficulty: undefined;
//        Results: { score: number };
// };
//
// export type RootStackScreenProps<T extends keyof RootStackParamList> =
//     NativeStackScreenProps<RootStackParamList, T>;