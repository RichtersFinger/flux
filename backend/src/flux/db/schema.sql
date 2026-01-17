-- meta tables
CREATE TABLE migrations (
  from_version text UNIQUE,
  to_version text UNIQUE,
  completed_at text
);

CREATE TABLE index_metadata (
    schema_version TEXT,
    initialized INTEGER,
    CONSTRAINT index_metadata_single_col_per_row CHECK (
        (CASE WHEN schema_version IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN initialized IS NOT NULL THEN 1 ELSE 0 END)
        = 1
    )
);

CREATE UNIQUE INDEX only_one_schema_version
ON index_metadata ((1))
WHERE schema_version IS NOT NULL;

-- auth and session-management
CREATE TABLE users (
    name TEXT NOT NULL PRIMARY KEY,
    -- configuration details
    is_admin INTEGER DEFAULT 0,
    -- user settings
    volume INTEGER DEFAULT 100,
    muted INTEGER DEFAULT 0,
    autoplay INTEGER DEFAULT 0
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

-- index tables
CREATE TABLE thumbnails (
    id TEXT NOT NULL PRIMARY KEY,
    path TEXT NOT NULL
);

CREATE TABLE records (
    id TEXT NOT NULL PRIMARY KEY,
    thumbnail_id TEXT NOT NULL REFERENCES thumbnails (id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK( type IN ('series','movie','collection') ),
    name TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE seasons (
    id TEXT NOT NULL PRIMARY KEY,
    record_id TEXT NOT NULL REFERENCES records (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER DEFAULT 0
);

CREATE UNIQUE INDEX unique_season_position
ON seasons (record_id, position);

CREATE TABLE videos (
    id TEXT NOT NULL PRIMARY KEY,
    record_id TEXT NOT NULL REFERENCES records (id) ON DELETE CASCADE,
    season_id TEXT REFERENCES seasons (id) ON DELETE CASCADE,
    thumbnail_id TEXT REFERENCES thumbnails (id) ON DELETE SET NULL,
    name TEXT,
    description TEXT,
    position INTEGER DEFAULT 0
);

CREATE UNIQUE INDEX unique_video_position
ON videos (record_id, season_id, position);

-- this distinction from videos-table is made to prepare for future support
-- of multiple tracks per video
CREATE TABLE tracks (
    id TEXT NOT NULL PRIMARY KEY,
    video_id TEXT NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    metadata_json text NOT NULL,
    is_primary_track INTEGER NOT NULL DEFAULT 1
);

-- only one track must be marked as primary
CREATE UNIQUE INDEX unique_primary_track
ON tracks (video_id)
WHERE is_primary_track = 1;

-- user playbacks
CREATE TABLE playbacks (
    username TEXT NOT NULL REFERENCES users (name) ON DELETE CASCADE,
    record_id TEXT NOT NULL REFERENCES records (id) ON DELETE CASCADE,
    video_id TEXT NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
    timestamp INTEGER,
    changed INTEGER
);

-- only one playback per user and record
CREATE UNIQUE INDEX unique_record_playback
ON playbacks (username, record_id);
