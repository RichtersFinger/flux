CREATE TABLE index_metadata (
    schema_version TEXT,
    initialized INTEGER,
    CONSTRAINT index_metadata_single_col_per_row CHECK (
        (CASE WHEN schema_version IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN initialized IS NOT NULL THEN 1 ELSE 0 END)
        = 1
    )
);

CREATE UNIQUE INDEX only_one_schema_version ON index_metadata ((1)) WHERE schema_version IS NOT NULL;

CREATE TABLE users (
    name TEXT NOT NULL PRIMARY KEY,
    -- configuration details
    dark_mode INTEGER DEFAULT 0
);

CREATE TABLE user_secrets (
    id TEXT NOT NULL PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users (name) ON DELETE CASCADE,
    salt TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE sessions (
    id TEXT NOT NULL PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users (name) ON DELETE CASCADE
);

CREATE TABLE records (
    id TEXT NOT NULL PRIMARY KEY,
    type TEXT CHECK( type IN ('series','movie','collection') ) NOT NULL,
    path TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE seasons (
    id TEXT NOT NULL PRIMARY KEY,
    record_id TEXT NOT NULL REFERENCES records (id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE episodes (
    id TEXT NOT NULL PRIMARY KEY,
    record_id TEXT NOT NULL REFERENCES records (id) ON DELETE CASCADE,
    season_id TEXT NOT NULL REFERENCES seasons (id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    name TEXT NOT NULL,
    metadata_json text NOT NULL
);

CREATE TABLE specials (
    id TEXT NOT NULL PRIMARY KEY,
    record_id TEXT NOT NULL REFERENCES records (id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    name TEXT NOT NULL,
    metadata_json text NOT NULL
);
