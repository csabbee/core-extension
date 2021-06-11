import { JsonRpcRequest } from "./jsonRpcEngine";

const AVALANCHE_AGGREGATOR_NAME = "metamask";

export default {
  async metamask_getProviderState(data) {
    return { ...data, result: { name: "this came from handler" } };
  },
  async metamask_sendDomainMetadata(data) {
    return { ...data, result: data.params };
  },

  getHandlerForKey(data: JsonRpcRequest<any>) {
    const handler = this[data.method];
    return handler && (() => handler(data));
  },
};