CREATE TABLE guild
(
    guild_id        VARCHAR(32) NOT NULL,
    prefix          TINYTEXT DEFAULT "!",
    drop_channel_id VARCHAR(32),
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
    drop_next       DATETIME,
    claim_next      DATETIME,
    dust_1          INT UNSIGNED DEFAULT 0,
    dust_2          INT UNSIGNED DEFAULT 0,
    dust_3          INT UNSIGNED DEFAULT 0,
    dust_4          INT UNSIGNED DEFAULT 0,
    dust_5          INT UNSIGNED DEFAULT 0,
    premium_currency INT UNSIGNED DEFAULT 0,
    patron          SMALLINT UNSIGNED DEFAULT 0,
    PRIMARY KEY(discord_id)
);

CREATE TABLE wishlist
(
    id              INT(11) AUTO_INCREMENT,
    discord_id      VARCHAR(32) NOT NULL,
    name            TEXT(50),
    group_name      TEXT(50),
    PRIMARY KEY(id)
);

CREATE TABLE card_base
(
    id              INT(11) AUTO_INCREMENT,
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
CREATE TABLE user_card
(
    id              INT(11) AUTO_INCREMENT,
    identifier      TEXT(5) NOT NULL,
    card_id         INT(11) NOT NULL,   
    serial_number   SMALLINT UNSIGNED NOT NULL,
    discord_id      VARCHAR(32) NOT NULL,
    original_owner  VARCHAR(32) NOT NULL,
    wear            TINYINT UNSIGNED DEFAULT 0,
    luck_coeff      DECIMAL(11, 10) DEFAULT 0,
    frame           INT(11),
    PRIMARY KEY(id),
    CONSTRAINT UserCardUnique UNIQUE (serial_number, card_id),
    CONSTRAINT UserCardUniqueIdentifier UNIQUE (identifier),
    FOREIGN KEY (frame) REFERENCES card_frame(id) ON DELETE SET NULL
);

CREATE TABLE card_frame
(
    id              INT(11) AUTO_INCREMENT,
    frame_name      TEXT(32),
    frame_url       TEXT(64),
    shoppable       BOOLEAN DEFAULT 0,
    PRIMARY KEY(id)
);

CREATE TABLE frame_shop
(

    frame_id        INT(11) NOT NULL,
    price           INT UNSIGNED DEFAULT 300,
    PRIMARY KEY(frame_id),
    FOREIGN KEY(frame_id) REFERENCES card_frame(id) ON DELETE CASCADE
);

CREATE TABLE user_item
(
    id              INT(11) AUTO_INCREMENT,
    discord_id      VARCHAR(32) NOT NULL,
    item_id         INT(11) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(discord_id) REFERENCES profile(discord_id) ON DELETE CASCADE
);

CREATE TABLE card_tag
(
    id              INT(11) AUTO_INCREMENT,
    discord_id      VARCHAR(32) NOT NULL,
    tag_name        TEXT(6),
    emoji           TEXT,
    PRIMARY KEY(id)
);

CREATE TABLE group
(
    id              INT(11) AUTO_INCREMENT,
    group_name      TEXT(64) NOT NULL,
    group_desc      TEXT(1000),
    PRIMARY KEY(id)
);