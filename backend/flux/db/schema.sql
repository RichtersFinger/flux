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
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE records (
    id TEXT NOT NULL PRIMARY KEY,
    type TEXT NOT NULL
);

CREATE TABLE record_metadata (
    record_id TEXT NOT NULL REFERENCES records (id) ON DELETE CASCADE,
    name TEXT NOT NULL
);
