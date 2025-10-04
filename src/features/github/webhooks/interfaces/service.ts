export interface IWebhooksService {
  verifyAndReceive(
    event: string,
    payload: string,
    signature: string,
  ): Promise<void>;
}
