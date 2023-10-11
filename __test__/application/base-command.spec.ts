import { Command, CommandBus, CommandHandlerBase } from 'src';

class CommandMock1 extends Command {}

class CommandMock2 extends Command {}

class SingleCommandHandler extends CommandHandlerBase<CommandMock1, null> {
  execute(command: CommandMock1): Promise<null> {
    return null;
  }
}

class MultiCommandHandler extends CommandHandlerBase<
  CommandMock1 | CommandMock2,
  null
> {
  execute(command: CommandMock1 | CommandMock2): Promise<null> {
    return null;
  }
}

const singleCommandHandler = new SingleCommandHandler();
const multiCommandHandler = new MultiCommandHandler();

const singleCommandHandlerFactory = () => singleCommandHandler;

const multiCommandHandlerFactory = () => multiCommandHandler;

describe('Test Command Bus', () => {
  const commandBus = CommandBus.factory();
  const commandMock1 = new CommandMock1();
  const commandMock2 = new CommandMock2();
  it('Test Single Command Bus', async () => {
    commandBus.registerCommand(CommandMock1)(singleCommandHandlerFactory);
    const spySingleCommandHandler = jest.spyOn(singleCommandHandler, 'execute');
    await commandBus.execute(commandMock1);
    expect(spySingleCommandHandler).toBeCalledWith(commandMock1);
    spySingleCommandHandler.mockReset();
  });

  it('Test Command Bus for Handler that handle multi command', async () => {
    commandBus.registerCommand(CommandMock1)(multiCommandHandlerFactory);
    commandBus.registerCommand(CommandMock2)(multiCommandHandlerFactory);
    const spyMultiCommandHandler = jest.spyOn(multiCommandHandler, 'execute');
    await commandBus.execute(commandMock1);
    expect(spyMultiCommandHandler).toBeCalledWith(commandMock1);
    await commandBus.execute(commandMock2);
    expect(spyMultiCommandHandler).toBeCalledWith(commandMock2);
    spyMultiCommandHandler.mockReset();
  });

  it('Test exclusiveness', async () => {
    commandBus.registerCommand(CommandMock1)(singleCommandHandlerFactory);
    const spyMultiCommandHandler = jest.spyOn(multiCommandHandler, 'execute');
    await commandBus.execute(commandMock1);
    expect(spyMultiCommandHandler).not.toHaveBeenCalled();
  });
});
