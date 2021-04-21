import winston from "winston";

export const Logger = winston.createLogger({
  level: `debug`,
  format: winston.format.cli(),
  transports: [
    new winston.transports.File({ filename: `error.log`, level: `error` }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

export const loggerSettings = {
  debug: true,
  verbose: true,
};
