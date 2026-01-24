export interface APIResponseMD {
  ok: boolean;
  error?: {
    code: number;
    short: string;
    long: string;
  };
}

export interface APIResponse<ContentType = unknown> {
  meta: APIResponseMD;
  content?: ContentType;
}

export interface UserConfigurationSettings {
  volume: number;
  muted: boolean;
  autoplay: boolean;
}

export interface UserConfiguration {
  user?: {
    name: string;
    isAdmin: boolean;
  };
  settings?: UserConfigurationSettings;
}

export interface SessionStore {
  loggedIn: boolean | undefined;
  checkLogin: () => void;
  logout: () => void;
  setLoggedIn: (loggedIn: boolean) => void;
  userConfiguration: UserConfiguration;
  setUserConfiguration: (userConfiguration: Partial<UserConfiguration>) => void;
  fetchUserConfiguration: () => void;
  putUserConfiguration: (
    settings: Partial<UserConfigurationSettings>,
    options?: {
      onSuccess?: () => void;
      onFail?: (message: string) => void;
    },
  ) => void;
}

export type RecordType = "series" | "movie" | "collection";

export interface RecordMetadata {
  id: string;
  type: RecordType;
  name: string;
  description?: string;
  thumbnailId?: string;
}

export interface Records {
  count: number;
  records: RecordMetadata[];
}

export interface VideoInfo {
  id: string;
  name: string;
  description: string;
  metadata: object;
  thumbnailId: string;
  trackId: string;
}

export interface SeasonInfo {
  id: string;
  name: string;
  episodes: VideoInfo[];
}

export interface SeriesInfo {
  seasons: SeasonInfo[];
  specials: VideoInfo[];
}

export type CollectionInfo = VideoInfo[];

export interface RecordInfo<ContentType = VideoInfo | SeriesInfo | CollectionInfo> extends RecordMetadata {
  content: ContentType;
}
