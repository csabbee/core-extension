import { ExtensionRequest } from '@src/background/connections/extensionConnection/models';
import { ExtensionRequestHandler } from '@src/background/connections/models';
import { injectable } from 'tsyringe';
import { TxHistoryItem } from '../models';
import { HistoryService } from './../HistoryService';

type HandlerType = ExtensionRequestHandler<
  ExtensionRequest.HISTORY_GET,
  TxHistoryItem[]
>;

@injectable()
export class GetHistoryHandler implements HandlerType {
  method = ExtensionRequest.HISTORY_GET as const;

  constructor(private historyService: HistoryService) {}

  handle: HandlerType['handle'] = async (request) => {
    const history = await this.historyService.getTxHistory();
    return {
      ...request,
      result: history,
    };
  };
}