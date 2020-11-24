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
CREATE TABLE card_base
(
    id              INT(11) AUTO_INCREMENT,
    identifier      TEXT(8) NOT NULL,
    flavor_text     TEXT(500),
    group_name      TEXT(32),
    subgroup_name   TEXT(32),
    individual_name TEXT(32) NOT NULL,
    rarity          TINYINT UNSIGNED DEFAULT 100,
    serial_total    SMALLINT UNSIGNED DEFAULT 0,
    serial_limit    SMALLINT UNSIGNED DEFAULT 0,
    PRIMARY KEY(id)
);
CREATE TABLE card_image
(
    card_id         INT(11) NOT NULL,
    tier_one        TEXT(64),
    tier_two        TEXT(64),
    tier_three      TEXT(64),
    tier_four       TEXT(64),
    tier_five       TEXT(64),
    tier_six        TEXT(64),
    PRIMARY KEY(card_id)
);