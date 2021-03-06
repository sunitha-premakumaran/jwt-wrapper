import { SignOptions, sign } from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

import { JwtBase } from './jwt-base';
import { IJwtParams } from './jwt-params.interface';
import { InvalidInitPropertyError } from "./errors";

export class JwtSign extends JwtBase {

  protected jwtOptions: SignOptions;
  protected jwtSecret: string | Buffer;

  private static _instance: JwtSign;

  private constructor() {
    super();
    this.jwtOptions.algorithm = 'RS256';
  }

  /**
   * Call this method to initialize the JWT sign utility.
   * @method init
   * @param  {IJwtParams} params An object containing the properties required
   * for configuring the JWT Sign utility.
   */
  public init(params: IJwtParams): void {
    try {
      if (!params.sign) {
        throw new InvalidInitPropertyError(params);
      }

      this.Issuer = params.issuer;
      this.Subject = params.subject;
      this.jwtSecret = fs.readFileSync(params.sign.privateKeyFile);
      this.jwtOptions.expiresIn = params.sign.expiryTimeSeconds;
    } catch (error) {
      console.error('Error initializing AppLogger.', error);
      throw error;
    }
  }

  /**
   * Returns an instance of JwtSign.
   * @method Instance
   * @return {JwtSign} A JwtSign instance.
   */
  public static get Instance(): JwtSign {
    return JwtSign._instance || (JwtSign._instance = new JwtSign());
  }

  private _initTokenExpiry(): void {
    let now = Math.floor(Date.now() / 1000);
  }

  /**
   * Signs and returns a JWT.
   * @method getToken
   * @param  {object}          payload  The payload to be signed.
   * @param  {string}          audience Target audience for the JWT.
   * @return {Promise<string>}          A Promise wrapping the signed contents.
   */
  async getToken(payload: object, audience: string): Promise<string> {
    if (!this.jwtSecret) {
      throw new Error('JwtSign not initialized. Make sure you are calling init() before calling this method. You only need to do this once in your app.');
    }
    try {
      return await this._getToken(payload, audience);
    } catch (error) {
      throw error;
    }
  }

  private _getToken(payload: object, audience: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this._initTokenExpiry();

      this.jwtOptions.audience = audience;

      sign({ payload: payload }, this.jwtSecret, this.jwtOptions, (err: Error, token: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  }
}
