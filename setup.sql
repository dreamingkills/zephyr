CREATE TABLE guild
(
    guild_id        VARCHAR(32) NOT NULL,
    prefix          TINYTEXT DEFAULT "!",
    PRIMARY KEY(guild_id)
);