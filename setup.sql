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
    bits            BIGINT UNSIGNED DEFAULT 0,
    bits_bank       BIGINT UNSIGNED DEFAULT 0,
    daily_last      DATE,
    PRIMARY KEY(discord_id)
);