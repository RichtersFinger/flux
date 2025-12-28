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
  putUserConfiguration: (settings: Partial<UserConfigurationSettings>) => void;
}

export interface RecordMetadata {
  id: string;
  type: "series" | "movie" | "collection";
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

export interface SeriesInfo {
  seasons: {
    id: string;
    name: string;
    episodes: VideoInfo[];
  }[];
  specials: VideoInfo[];
}

export type CollectionInfo = VideoInfo[];

export interface RecordInfo extends RecordMetadata {
  content: VideoInfo | SeriesInfo | CollectionInfo;
}
