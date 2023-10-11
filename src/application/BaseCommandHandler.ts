import { UnitOfWorkPort } from '@ports/uow';
import { Command } from './BaseCommand';

export abstract class CommandHandlerBase<
  CommandT extends Command,
  CommandHandlerReturnType,
> {
  abstract execute(command: CommandT): Promise<CommandHandlerReturnType>;
}

export abstract class UowCommandHandlerBase<
  CommandT extends Command,
  CommandHandlerReturnType = unknown,
> implements CommandHandlerBase<CommandT, CommandHandlerReturnType>
{
  constructor(protected readonly unitOfWork: UnitOfWorkPort) {}

  // Forces all command handlers to implement a handle method
  abstract handle(command: CommandT): Promise<CommandHandlerReturnType>;

  /**
   * Execute a command as a UnitOfWork to include
   * everything in a single atomic database transaction
   */
  execute(command: CommandT): Promise<CommandHandlerReturnType> {
    return this.unitOfWork.execute(command.correlationId, async () =>
      this.handle(command),
    );
  }
}
