CREATE TABLE guild
(
    guild_id        VARCHAR(32) NOT NULL,
    prefix          TINYTEXT DEFAULT "!",
    PRIMARY KEY(guild_id)
);
CREATE TABLE profile
(
    discord_id      VARCHAR(32) NOT NULL,
    private         BOOLEAN DEFAULT 0,
    blurb           TEXT(500),
    bits            INT UNSIGNED DEFAULT 0,
    bits_bank       INT UNSIGNED DEFAULT 0,
    daily_last      DATE,
    daily_streak    SMALLINT UNSIGNED DEFAULT 0,
    PRIMARY KEY(discord_id)
);