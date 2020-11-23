CREATE TABLE guild
(
    guild_id        VARCHAR(32) NOT NULL,
    prefix          TINYTEXT DEFAULT "!",
    PRIMARY KEY(guild_id)
);
CREATE TABLE profile
(
    discord_id      VARCHAR(32) NOT NULL,
    blurb           TEXT(500),
    bits            BIGINT UNSIGNED DEFAULT 0,
    bits_bank       BIGINT UNSIGNED DEFAULT 0,
    daily_next      BIGINT,
    PRIMARY KEY(discord_id)
);