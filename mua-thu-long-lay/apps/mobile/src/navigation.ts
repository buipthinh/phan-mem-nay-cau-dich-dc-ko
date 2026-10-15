import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Tabs: undefined;
  /** `stamp` có khi mở từ màn quét QR: 'new' là vừa nhận tem, 'owned' là đã có từ trước. */
  StallDetail: { id: string; stamp?: 'new' | 'owned' };
  Scanner: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
