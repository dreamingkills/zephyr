interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export class MessageEmbed {
  title?: string;
  description?: string;
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  color?: number = parseInt("1FB7CF", 16);
  footer?: { text: string; icon_url?: string };
  fields: EmbedField[] = [];
  image?: {
    url: string;
  };

  public setTitle(title: string): MessageEmbed {
    this.title = title;
    return this;
  }
  public setDescription(description: string): MessageEmbed {
    this.description = description;
    return this;
  }
  public setAuthor(name: string, iconUrl?: string, url?: string): MessageEmbed {
    this.author = { name, icon_url: iconUrl, url };
    return this;
  }
  public setColor(color: string | number): MessageEmbed {
    if (typeof color === "string") {
      if (color.startsWith("#")) {
        this.color = parseInt(color.slice(1), 16);
      } else this.color = parseInt(color, 16);
    } else this.color = color;
    return this;
  }
  public setFooter(footer: string, iconUrl?: string): MessageEmbed {
    this.footer = { text: footer, icon_url: iconUrl };
    return this;
  }
  public addField(field: {
    name: string;
    value: string;
    inline?: boolean;
  }): MessageEmbed {
    this.fields.push(field);
    return this;
  }
  public setImage(url: string): MessageEmbed {
    this.image = { url };
    return this;
  }
}
