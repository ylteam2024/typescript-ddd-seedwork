import { Query } from './query.base';
import { Command } from './command.base';
import { BaseTE } from '@logic/fp';

export type CommandHandler<Cmd extends Command<unknown>, Res> = (
  command: Cmd,
) => BaseTE<Res>;

export type QueryHandler<Q extends Query<unknown>, Res> = (
  query: Q,
) => BaseTE<Res>;

export type UsecaseHandler =
  | CommandHandler<Command<unknown>, unknown>
  | QueryHandler<Query<unknown>, unknown>;
