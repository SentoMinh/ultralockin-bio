-- Accounts (one per Discord user), sessions, profiles, invites, uploads, view counts.
-- Times are epoch milliseconds; days are UTC 'YYYY-MM-DD'.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  discord_id TEXT NOT NULL UNIQUE,
  discord_username TEXT NOT NULL DEFAULT '',
  discord_name TEXT NOT NULL DEFAULT '',
  discord_avatar TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  banned INTEGER NOT NULL DEFAULT 0
);

-- id is the SHA-256 of the cookie token, so a database leak can't be used to log in.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE profiles (
  username TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  config TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE invites (
  code TEXT PRIMARY KEY,
  created_by TEXT NOT NULL,
  used_by TEXT,
  created_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE TABLE media (
  key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  size INTEGER NOT NULL,
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX media_user ON media(user_id);

-- Keyed by the profile owner's user id, so renaming a profile keeps its views.
CREATE TABLE view_counts (
  id TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE view_visitors (
  id TEXT NOT NULL,
  day TEXT NOT NULL,
  visitor TEXT NOT NULL,
  PRIMARY KEY (id, day, visitor)
);
