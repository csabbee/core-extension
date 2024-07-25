export enum SendErrorMessage {
  AMOUNT_REQUIRED = 'AMOUNT_REQUIRED',
  ADDRESS_REQUIRED = 'ADDRESS_REQUIRED',
  C_CHAIN_REQUIRED = 'C_CHAIN_REQUIRED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_NETWORK_FEE = 'INVALID_NETWORK_FEE',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_BALANCE_FOR_FEE = 'INSUFFICIENT_BALANCE_FOR_FEE',
  TOKEN_REQUIRED = 'TOKEN_REQUIRED',
  UNSUPPORTED_TOKEN = 'UNSUPPORTED_TOKEN',
  UNABLE_TO_FETCH_UTXOS = 'UNABLE_TO_FETCH_UTXOS',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  UNSUPPORTED_BY_LEDGER = 'UNSUPPORTED_BY_LEDGER',
  SEND_NOT_AVAILABLE = 'SEND_NOT_AVAILABLE',
}