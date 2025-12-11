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

export interface UserConfiguration {
  user?: {
    name: string;
    isAdmin: boolean;
  }
  settings?: {
    volume: number;
    autoplay: boolean;
  }
}

export interface SessionStore {
  loggedIn: boolean | undefined;
  checkLogin: () => void;
  logout: () => void;
  setLoggedIn: (loggedIn: boolean) => void;
  userConfiguration: UserConfiguration;
  setUserConfiguration: (userConfiguration: Partial<UserConfiguration>) => void;
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
