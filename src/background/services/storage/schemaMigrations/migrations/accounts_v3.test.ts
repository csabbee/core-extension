import { AccountType } from '@src/background/services/accounts/models';
import accounts_v3, { PrimaryAccount } from './accounts_v3';
import Joi from 'joi';

describe('background/services/storage/schemaMigrations/migrations/accounts_v3', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  const validInput = {
    active: {
      index: 0,
      id: 'uuid1',
      name: 'name',
      addressBTC: 'addressBTC',
      addressC: 'addressC',
      type: AccountType.PRIMARY,
    },
    primary: [
      {
        index: 0,
        id: 'uuid1',
        name: 'name',
        addressBTC: 'addressBTC',
        addressC: 'addressC',
        type: AccountType.PRIMARY,
      } as PrimaryAccount,
      {
        index: 1,
        id: 'uuid2',
        name: 'name 2',
        addressBTC: 'addressBTC',
        addressC: 'addressC',
        type: AccountType.PRIMARY,
      } as PrimaryAccount,
    ],
    imported: {},
  };

  it('should accept the previous account schema input', () => {
    const result = accounts_v3.previousSchema.validate(validInput);

    expect(result).toEqual({
      error: undefined,
      value: validInput,
    });
  });

  it('should reject the wrong previous account schema input', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { index, id, addressBTC, addressC, name, type, ...invalidInput } =
      validInput.primary[0] ?? {};
    const result = accounts_v3.previousSchema.validate(invalidInput);

    expect(result).toEqual({
      value: {},
      error: expect.any(Joi.ValidationError),
    });
  });

  it('should migrate the accounts to v3 successfully', async () => {
    const result = await accounts_v3.up(validInput);
    const walletId = 'migrated-wallet-id';
    expect(result).toStrictEqual({
      active: {
        index: 0,
        id: 'uuid1',
        name: 'name',
        addressBTC: 'addressBTC',
        addressC: 'addressC',
        type: AccountType.PRIMARY,
        walletId,
      },
      primary: {
        [walletId]: [
          {
            index: 0,
            id: 'uuid1',
            name: 'name',
            addressBTC: 'addressBTC',
            addressC: 'addressC',
            type: AccountType.PRIMARY,
            walletId,
          },
          {
            index: 1,
            id: 'uuid2',
            name: 'name 2',
            addressBTC: 'addressBTC',
            addressC: 'addressC',
            type: AccountType.PRIMARY,
            walletId,
          },
        ],
      },
      imported: {},
      version: 3,
    });
  });
});
