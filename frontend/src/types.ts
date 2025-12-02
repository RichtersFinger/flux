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
  loggedIn: boolean;
  checkLogin: () => void;
  setLoggedIn: (loggedIn: boolean) => void;
  userConfiguration: UserConfiguration;
  setUserConfiguration: (userConfiguration: Partial<UserConfiguration>) => void;
}
