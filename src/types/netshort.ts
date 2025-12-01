// src/types/netshort.ts

export interface ShortPlayItem {
  id: string;
  shortPlayId: string;
  shortPlayLibraryId?: string;
  shortPlayName: string;
  shortPlayLabels?: string;
  labelArray?: string[];
  isNewLabel?: boolean;
  shortPlayCover?: string;
  groupShortPlayCover?: string;
  shotIntroduce?: string;
  script?: number;
  scriptName?: string | null;
  scriptType?: number;
  heatScore?: number;
  heatScoreShow?: string | null;
  totalReserveNum?: string;
  isReserve?: number;
  publishTime?: number;
  isNeedHighImage?: boolean;
}

export interface ShortPlayGroup {
  contentType: number;
  groupId: string;
  contentName: string;
  contentModel: number;
  contentInfos: ShortPlayItem[];
  heatShowSwitch?: number;
  freeEndTime?: number;
  hiddenName?: number;
  highShowCount?: number;
  contentRemark?: string;
}
